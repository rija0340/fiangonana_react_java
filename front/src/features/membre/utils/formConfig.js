import * as yup from "yup";

export const schema = yup.object({
  nom: yup.string().nullable(),
  prenom: yup.string().required("Le prénom est requis"),
  sexe: yup.string().required("Le sexe est requis"),
  dateBapteme: yup.date().nullable().typeError("Date invalide"),
  dateNaissance: yup.date().nullable().typeError("Date invalide"),
  telephone: yup.string().nullable(),
  situationMatrimoniale: yup.string().nullable(),
  occupation: yup.string().nullable(),
  observation: yup.string().nullable(),
}).required();

export const fields = [
  { name: "nom", label: "Nom", type: "text" },
  { name: "prenom", label: "Prénom *", type: "text" },
  { name: "dateNaissance", label: "Date de naissance", type: "date" },
  {
    name: "sexe",
    label: "Sexe *",
    type: "select",
    options: [
      { value: "masculin", label: "Masculin" },
      { value: "feminin", label: "Féminin" },
    ],
  },
  { name: "dateBapteme", label: "Date de baptême", type: "date" },
  { name: "telephone", label: "Téléphone", type: "text" },
  {
    name: "situationMatrimoniale",
    label: "Situation matrimoniale",
    type: "select",
    options: [
      { value: "Célibataire", label: "Célibataire" },
      { value: "Marié(e)", label: "Marié(e)" },
      { value: "Divorcé(e)", label: "Divorcé(e)" },
      { value: "Veuf(ve)", label: "Veuf(ve)" },
    ],
  },
  { name: "occupation", label: "Occupation", type: "text" },
  { name: "observation", label: "Observation", type: "textarea" },
];

export const config = {
  modelName: "membre",
  navigateTo: "/membres",
};