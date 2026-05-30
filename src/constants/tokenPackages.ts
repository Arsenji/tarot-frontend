export type TokenPackageId = '10' | '25' | '50' | '100';

export type TokenPackage = {
  id: TokenPackageId;
  tokens: number;
  priceRub: number;
  name: string;
};

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: '10', tokens: 10, priceRub: 1, name: '10 токенов' }, // TODO: вернуть 100 после тестов
  { id: '25', tokens: 25, priceRub: 225, name: '25 токенов' },
  { id: '50', tokens: 50, priceRub: 400, name: '50 токенов' },
  { id: '100', tokens: 100, priceRub: 700, name: '100 токенов' },
];

export const YES_NO_TOKEN_COST = 5;
export const THREE_CARDS_TOKEN_COST = 10;
export const FREE_YES_NO_LIFETIME = 1;
export const FREE_THREE_CARDS_LIFETIME = 1;
