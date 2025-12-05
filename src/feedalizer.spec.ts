import { beforeEach, describe, expect, it } from 'vitest';
import { Feedalizer } from './feedalizer';

const PRIVATE_KEY =
  'ffffcab1c9bd42f2168d872c491e36f08f938085b3b2031f2f9c7c53e7f1c05f';
const STAMP =
  '7048dbb86830ca6c8a90937acbbcc8cd610478b38942a9e592bd331d00cd51c3';

let feedalizer: Feedalizer;

const baseProfile = {
  name: 'John Doe',
  age: '22',
};

describe('Feedalizer', () => {
  beforeEach(() => {
    feedalizer = new Feedalizer(PRIVATE_KEY, STAMP);
  });

  it.sequential(
    'should return empty object when deserializing non-existing data',
    async () => {
      const resultFromFeed = await feedalizer.deserialize('randomstring');

      expect(resultFromFeed).toEqual({});
    },
    30000
  );

  it.sequential(
    'should serialize and deserialize data correctly',
    async () => {
      await feedalizer.serialize('profile', baseProfile);

      const resultFromFeed = await feedalizer.deserialize('profile');

      console.log('Result from feed:', resultFromFeed);

      expect(resultFromFeed.name).toEqual('John Doe');
      expect(resultFromFeed.age).toEqual('22');
    },
    30000
  );

  it.sequential(
    'should update existing data',
    async () => {
      await feedalizer.serialize('profile', baseProfile);

      const resultFromFeed = await feedalizer.deserialize('profile');

      console.log('Result from feed:', resultFromFeed);

      expect(resultFromFeed.name).toEqual('John Doe');
      expect(resultFromFeed.age).toEqual('22');

      await feedalizer.serialize('profile', {
        name: 'Mr. John Doe',
        age: '30',
        status: 'married',
      });

      const updatedResultFromFeed = await feedalizer.deserialize('profile');

      console.log('Updated result from feed:', updatedResultFromFeed);

      expect(updatedResultFromFeed.name).toEqual('Mr. John Doe');
      expect(updatedResultFromFeed.age).toEqual('30');
      expect(updatedResultFromFeed.status).toEqual('married');
    },
    60000
  );

  it.sequential(
    'should manage separated files',
    async () => {
      await feedalizer.serialize('profile', baseProfile);
      await feedalizer.serialize('settings', {
        theme: 'dark',
        notifications: 'enabled',
      });

      const profileDataFromFeed = await feedalizer.deserialize('profile');

      expect(profileDataFromFeed.name).toEqual('John Doe');
      expect(profileDataFromFeed.age).toEqual('22');

      const settingsDataFromFeed = await feedalizer.deserialize('settings');

      expect(settingsDataFromFeed.theme).toEqual('dark');
      expect(settingsDataFromFeed.notifications).toEqual('enabled');
    },
    30000
  );
});
