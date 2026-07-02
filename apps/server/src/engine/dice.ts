export function rollDice () : number {
    return Math.floor(Math.random() * 6) + 1;
}

export function isBonusRoll (value : number) : boolean {
    return value === 6;
}

export function canEnterBoard (diceValue : number) : boolean {
    return diceValue === 6;
}