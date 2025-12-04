import { Bee, Bytes, MantarayNode, Reference } from '@ethersphere/bee-js';
import { Binary } from 'cafe-utility';
import { Wallet } from 'ethers';

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
    this.wallet = new Wallet(privateKey);
    this.bee = new Bee(BEE_URL);
  }

  async getFeedReference(): Promise<Reference> {
    const feedRef = await this.bee.createFeedManifest(
      this.stampId,
      TOPIC,
      this.wallet.address
    );
    console.log('feed reference:', feedRef.toString());
    return feedRef;
  }

  private hexStringToReference(reference: string): Reference {
    return new Reference(Bytes.fromUtf8(reference));
  }

  private pathToBytes(pathString: string): Uint8Array {
    return new TextEncoder().encode(pathString);
  }

  public async serialize(
    namespace: string,
    object: Record<string, string>
  ): Promise<void> {
    const feedRef = await this.getFeedReference();

    const filename = `${namespace}.json`;

    const uploadResult = await this.bee.uploadData(
      this.stampId,
      JSON.stringify(object)
    );

    console.log('data update result:', uploadResult.reference.toString());

    const mantaray = new MantarayNode();

    mantaray.addFork(
      this.pathToBytes('/'),
      this.hexStringToReference(NULL_ENTRY),
      {
        'website-index-document': `${namespace}.json`,
      }
    );
    mantaray.addFork(this.pathToBytes(filename), uploadResult.reference);

    const savedMantaray = await mantaray.saveRecursively(
      this.bee,
      this.stampId
    );

    console.log('savedMantaray reference:', savedMantaray.reference.toString());

    const writer = this.bee.makeFeedWriter(TOPIC, this.privateKey);
    await writer.uploadReference(this.stampId, savedMantaray.reference);
  }

  public async deserialize(namespace: string): Promise<Record<string, string>> {
    const reader = this.bee.makeFeedReader(TOPIC, this.wallet.address);
    const feedLatest = await reader.downloadReference();

    console.log('latest feed reference:', feedLatest.reference.toString());

    const node = await MantarayNode.unmarshal(this.bee, feedLatest.reference);
    await node.loadRecursively(this.bee);

    const filename = `${namespace}.json`;
    const fork = node.find(filename);

    const namespaceAddress = fork?.targetAddress;
    if (namespaceAddress) {
      const data = await this.bee.downloadData(namespaceAddress);

      return data.toJSON() as Record<string, string>;
    }

    return {};
  }
}
