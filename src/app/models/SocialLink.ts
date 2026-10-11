import type {IconDefinition} from "@fortawesome/free-brands-svg-icons";

export interface SocialLink {
  readonly label?: string;
  readonly icon: IconDefinition;
  readonly link: string;
}
