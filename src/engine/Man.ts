import { Entity, type Team } from "./Entity";
import type { Vector2 } from "./Vector2";

export class Man extends Entity {
  readonly team: Team = "Man";
  readonly radius = 12;
  readonly maxHp = 120;
  readonly speed = 90;
  readonly damage = 16;
  readonly range = 40;
  readonly attackSpeed = 1.2;

  constructor(pos: Vector2) {
    super(pos);
    this.hp = this.maxHp;
  }
}
