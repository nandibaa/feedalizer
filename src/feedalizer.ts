import { Bee, Bytes, MantarayNode, Reference } from '@ethersphere/bee-js';
import { Binary } from 'cafe-utility';
import { Wallet } from 'ethers';

const TOPIC = '00'.repeat(32);
const BEE_URL = 'http://localhost:1633';
const NULL_ENTRY = '00'.repeat(32);

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

    console.log(
      'savedMantaray reference:',
      Binary.uint8ArrayToHex(savedMantaray.reference.toUint8Array())
    );

    const writer = this.bee.makeFeedWriter(TOPIC, this.privateKey);
    await writer.uploadReference(this.stampId, savedMantaray.reference);
  }

  public async deserialize(namespace: string): Promise<Record<string, string>> {
    const feedRef = await this.getFeedReference();

    const reader = this.bee.makeFeedReader(TOPIC, this.wallet.address);
    const stuff = await reader.downloadReference();

    console.log(
      'downloaded feed stuff reference:',
      Binary.uint8ArrayToHex(stuff.reference.toUint8Array())
    );

    const node = await MantarayNode.unmarshal(this.bee, feedRef);
    await node.loadRecursively(this.bee);

    console.log('node:', node);

    return {};
  }
}
