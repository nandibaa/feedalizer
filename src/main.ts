import { Feedalizer } from './feedalizer';

const PRIVATE_KEY =
  'ffffcab1c9bd42f2168d872c491e36f08f938085b3b2031f2f9c7c53e7f1c05e';
const STAMP = 'your stamp here';

test();

async function test() {
  const profile = {
    name: 'Nandor',
    age: '18', // :)
  };

  const feedalizer = new Feedalizer(PRIVATE_KEY, STAMP);
  await feedalizer.serialize('profile', profile);

  const profileFromFeed = await feedalizer.deserialize('profile');

  console.log(profileFromFeed);
}
