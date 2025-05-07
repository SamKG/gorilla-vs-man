import { Entity, type Team } from "./Entity";
import type { Vector2 } from "./Vector2";

export class Gorilla extends Entity {
  readonly team: Team = "Gorilla";
  readonly radius = 16;
  readonly maxHp = 200;
  readonly speed = 65;
  readonly damage = 24;
  readonly range = 32;
  readonly attackSpeed = 0.8;

  constructor(pos: Vector2) {
    super(pos);
    this.hp = this.maxHp;
  }
}
