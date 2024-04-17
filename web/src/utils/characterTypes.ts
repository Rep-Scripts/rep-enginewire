export interface CharacterInterface {
  citizenid: string;
  firstname: string;
  lastname: string;
  avatar: string;
  lvl: number;
  time: number;
  job: string;
  gang: string;
  vehicles: number;
  houses: number;
  cash: number;
  bank: number;
  unlock: boolean;
  gender: 'male' | 'female';
}

interface EmptyCharacterInterface {}

type CharacterOrEmpty = CharacterInterface | EmptyCharacterInterface;

export const mockCharacters: CharacterOrEmpty[] = [
  {  
    citizenid: "1542",
    firstname: "Nguyen",
    lastname: "Thomas",
    avatar: "https://cdn.discordapp.com/attachments/1186666454871973888/1228732491498520676/image_9.png?ex=662d1d4e&is=661aa84e&hm=5b336bba9f8e2d68efa4687fa9526b4975b5d4ecc863782b105b59ac814d35ef&",
    lvl: 15,
    time: 4000,
    job: "Thất nghiệp",
    gang: "Grove Street",
    vehicles: 4,
    houses: 1,
    cash: 200000,
    bank: 50000000,
    gender: 'male',},
  {unlock: true},
  {},
];
