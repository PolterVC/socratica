import mcgillLogo from "@/assets/mcgill-logo.png";
import udemLogo from "@/assets/udem-logo.png";
import concordiaLogo from "@/assets/concordia-logo.png";

export interface Logo {
  name: string;
  src: string;
  alt: string;
  url?: string;
}

export const universityLogos: Logo[] = [
  {
    name: "McGill University",
    src: mcgillLogo,
    alt: "McGill University logo",
    url: "https://www.mcgill.ca"
  },
  {
    name: "Université de Montréal",
    src: udemLogo,
    alt: "Université de Montréal logo",
    url: "https://www.umontreal.ca"
  },
  {
    name: "Concordia University",
    src: concordiaLogo,
    alt: "Concordia University logo",
    url: "https://www.concordia.ca"
  }
];
