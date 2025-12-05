import { Bee, Bytes, MantarayNode, Reference } from '@ethersphere/bee-js';
import { Wallet } from 'ethers';
import { getFilename, sleep } from './util';

const TOPIC = '00'.repeat(32);
const BEE_URL = 'http://localhost:1633';
const NULL_ENTRY = '00'.repeat(32);

export function createKeyValue(
  key: string,
  value: string | number | boolean,
  padLength?: number
): string {
  return `${key + ': ' + (padLength ? padLength + 1 : 0)} ${String(value)}`;
}

export class Feedalizer {
  private readonly wallet: Wallet;
  private readonly bee: Bee;

  constructor(private readonly privateKey: string, readonly stampId: string) {
    this.wallet = new Wallet(privateKey); // with IOC container this can be simplified
    this.bee = new Bee(BEE_URL);
  }

  private pathToBytes(pathString: string): Uint8Array {
    return new TextEncoder().encode(pathString);
  }

  private async getMantaray(): Promise<MantarayNode> {
    try {
      const reader = this.bee.makeFeedReader(TOPIC, this.wallet.address);
      const feedLatest = await reader.downloadReference();

      const node = await MantarayNode.unmarshal(this.bee, feedLatest.reference);
      await node.loadRecursively(this.bee);

      return node;
    } catch (error) {
      const mantaray = new MantarayNode();
      return mantaray;
    }
  }

  public async serialize(
    namespace: string,
    object: Record<string, string>
  ): Promise<void> {
    const node = await this.getMantaray();

    const filename = getFilename(namespace);

    const uploadResult = await this.bee.uploadData(
      this.stampId,
      JSON.stringify(object)
    );

    const fork = node.find(filename);
    if (fork) {
      node.removeFork(filename);
    }

    node.addFork(this.pathToBytes(filename), uploadResult.reference);

    const savedMantaray = await node.saveRecursively(this.bee, this.stampId);

    const writer = this.bee.makeFeedWriter(TOPIC, this.privateKey);
    await writer.uploadReference(this.stampId, savedMantaray.reference);

    await sleep(5000); // wait for feed to update
  }

  public async deserialize(namespace: string): Promise<Record<string, string>> {
    const node = await this.getMantaray();

    const filename = getFilename(namespace);
    const fork = node.find(filename);

    const namespaceAddress = fork?.targetAddress;
    if (namespaceAddress) {
      const data = await this.bee.downloadData(namespaceAddress);

      return data.toJSON() as Record<string, string>;
    }

    return {};
  }
}
