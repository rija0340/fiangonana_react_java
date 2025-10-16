import { useNavigate } from "react-router-dom";
import GenericForm from "./GenericForm";

export const GenericCreation = ({ modelName, apiCreate, schema, fields, navigateTo }) => {
  const navigate = useNavigate();

  const handleCreate = async (data) => {
    try {
      await apiCreate(data);
      navigate(navigateTo);
    } catch (error) {
      console.error(`Error creating ${modelName}:`, error);
    }
  };

  return (
    <GenericForm
      defaultValues={{}}
      onSubmit={handleCreate}
      isEditMode={false}
      schema={schema}
      fields={fields}
      modelName={modelName}
    />
  );
};