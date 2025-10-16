import * as yup from "yup";

export const kilasySchema = yup.object({
  nom: yup.string().required("Le nom est requis").max(255, "Le nom ne peut pas dépasser 255 caractères"),
  libelle: yup.string().nullable().max(255, "Le libellé ne peut pas dépasser 255 caractères"),
  description: yup.string().nullable(),
}).required();

export const kilasyFields = [
  { name: "nom", label: "Nom *", type: "text" },
  { name: "libelle", label: "Libellé", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

export const kilasyConfig = {
  modelName: "kilasys",
  navigateTo: "/kilasys",
};
