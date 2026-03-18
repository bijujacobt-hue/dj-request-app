import { describe, it, expect } from 'vitest';
import { generateName } from '../../services/nameGenerator.js';

describe('nameGenerator', () => {
  it('returns a non-empty string', () => {
    const name = generateName();
    expect(name).toBeTruthy();
    expect(typeof name).toBe('string');
  });

  it('returns "Adjective Animal" format (two words)', () => {
    const name = generateName();
    const parts = name.split(' ');
    expect(parts).toHaveLength(2);
    expect(parts[0][0]).toBe(parts[0][0].toUpperCase());
    expect(parts[1][0]).toBe(parts[1][0].toUpperCase());
  });

  it('generates 100 names without errors', () => {
    const names = [];
    for (let i = 0; i < 100; i++) {
      const name = generateName();
      expect(name).toBeTruthy();
      names.push(name);
    }
    expect(names).toHaveLength(100);
  });

  it('generates reasonably unique names (max ~30% dupes in 50 calls)', () => {
    const names = new Set();
    for (let i = 0; i < 50; i++) {
      names.add(generateName());
    }
    expect(names.size).toBeGreaterThan(35);
  });

  it('only uses known adjectives and animals', () => {
    const adjectives = [
      'Happy', 'Pink', 'Angry', 'Calm', 'Silly', 'Brave', 'Gentle', 'Wild', 'Cool', 'Zen',
      'Lucky', 'Swift', 'Sunny', 'Quiet', 'Bold', 'Lazy', 'Witty', 'Funky', 'Jazzy', 'Cosmic',
      'Groovy', 'Neon', 'Chill', 'Fierce', 'Royal', 'Sneaky', 'Sparkly', 'Turbo', 'Mighty', 'Mystic'
    ];
    const animals = [
      'Lion', 'Panda', 'Tiger', 'Elephant', 'Dolphin', 'Eagle', 'Fox', 'Bear', 'Wolf', 'Owl',
      'Falcon', 'Otter', 'Koala', 'Penguin', 'Hawk', 'Lynx', 'Raven', 'Jaguar', 'Parrot', 'Gecko',
      'Cobra', 'Shark', 'Phoenix', 'Dragon', 'Panther', 'Rabbit', 'Moose', 'Husky', 'Crane', 'Bison'
    ];

    for (let i = 0; i < 20; i++) {
      const [adj, animal] = generateName().split(' ');
      expect(adjectives).toContain(adj);
      expect(animals).toContain(animal);
    }
  });
});
