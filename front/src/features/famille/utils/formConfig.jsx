import * as yup from "yup";

export const schema = yup.object({
  nom: yup.string().required('Le nom est requis'),
  adresse: yup.string().nullable(),
  observation: yup.string().nullable(),

}).required();

export const fields = [
  { name: "nom", label: "Nom *", type: "text" },
  { name: "adresse", label: "Adresse", type: "text" },
  { name: "observation", label: "Observation", type: "text" },

];

export const config = {
  modelName: "famille",
  navigateTo: "/familles",
};