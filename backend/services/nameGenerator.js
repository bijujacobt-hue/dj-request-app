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

function generateName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal}`;
}

module.exports = { generateName };
