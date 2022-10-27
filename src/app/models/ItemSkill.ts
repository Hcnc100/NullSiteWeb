import {IconDefinition} from "@fortawesome/free-brands-svg-icons";

export class ItemSkill {
  readonly name: string;
  readonly icon: IconDefinition;
  readonly color: string;

  constructor(
    name: string,
    icon: IconDefinition,
    color: string,
  ) {
    this.name = name;
    this.icon = icon;
    this.color = color;
  }
}
