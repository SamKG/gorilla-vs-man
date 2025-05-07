import { Vector2 } from "./Vector2";

export type Team = "Man" | "Gorilla";

let NEXT_ID = 0;

export abstract class Entity {
  readonly id = NEXT_ID++;
  abstract readonly team: Team;

  pos: Vector2;
  vel: Vector2 = new Vector2(0, 0);

  /* --- stats provided by subclasses --- */
  abstract readonly radius: number;
  abstract readonly maxHp: number;
  abstract readonly speed: number;
  abstract readonly damage: number;
  abstract readonly range: number;
  abstract readonly attackSpeed: number;

  hp: number; // set by subclass after super()
  private attackTimer = 0;

  constructor(pos: Vector2) {
    this.pos = pos;
    this.hp = 0; // real value assigned in derived ctor
  }

  get dead() {
    return this.hp <= 0;
  }

  step(dt: number, entities: Entity[]): void {
    const enemies = entities.filter((e) => e.team !== this.team);
    if (enemies.length === 0) return;

    let nearest = enemies[0];
    let nearestDist = Vector2.distance(this.pos, nearest.pos);
    for (let i = 1; i < enemies.length; i++) {
      const d = Vector2.distance(this.pos, enemies[i].pos);
      if (d < nearestDist) {
        nearest = enemies[i];
        nearestDist = d;
      }
    }

    this.attackTimer += dt;
    if (nearestDist <= this.range) {
      if (this.attackTimer >= 1 / this.attackSpeed) {
        nearest.hp -= this.damage;
        this.attackTimer = 0;
      }
      this.vel = new Vector2(0, 0);
    } else {
      const dir = Vector2.from(nearest.pos).sub(this.pos).normalize();
      this.vel = dir.scale(this.speed);
    }

    this.pos.add(Vector2.from(this.vel).scale(dt));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.team === "Man" ? "#2d8cf0" : "#d9482d";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    const barW = this.radius * 2;
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.pos.x - this.radius,
      this.pos.y - this.radius - 10,
      barW,
      4,
    );
    ctx.fillStyle = "lime";
    ctx.fillRect(
      this.pos.x - this.radius,
      this.pos.y - this.radius - 10,
      barW * (this.hp / this.maxHp),
      4,
    );
  }
}
