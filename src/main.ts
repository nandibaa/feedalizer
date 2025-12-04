import { Feedalizer } from './feedalizer';

const PRIVATE_KEY =
  'ffffcab1c9bd42f2168d872c491e36f08f938085b3b2031f2f9c7c53e7f1c05e';
const STAMP =
  '7048dbb86830ca6c8a90937acbbcc8cd610478b38942a9e592bd331d00cd51c3';

test();

async function test() {
  const car = {
    name: 'Citroen',
    age: '29',
  };

  const feedalizer = new Feedalizer(PRIVATE_KEY, STAMP);
  await feedalizer.serialize('car', car);

  const profileFromFeed = await feedalizer.deserialize('profile');

  console.log(profileFromFeed);

  const carFromFeed = await feedalizer.deserialize('car');

  console.log(carFromFeed);
}
