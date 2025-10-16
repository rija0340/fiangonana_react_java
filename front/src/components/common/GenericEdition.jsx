import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import GenericForm from "./GenericForm";
import { snakeToCamelCase, camelToSnakeCase } from "../../utils/caseConverter";

export const GenericEdition = ({ modelName, apiGet, apiUpdate, schema, fields, navigateTo }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [defaultValues, setDefaultValues] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet(id);
        // Convert snake_case keys from API to camelCase for form
        const convertedData = snakeToCamelCase(data);
        setDefaultValues(convertedData);
      } catch (error) {
        console.error(`Error fetching ${modelName}:`, error);
      }
    };
    fetchData();
  }, [id, apiGet, modelName]);

  const handleUpdate = async (data) => {
    try {
      // Convert camelCase data back to snake_case for API
      const convertedData = camelToSnakeCase(data);
      await apiUpdate(id, convertedData);
      navigate(navigateTo);
    } catch (error) {
      console.error(`Error updating ${modelName}:`, error);
    }
  };

  return (
    <GenericForm
      defaultValues={defaultValues}
      onSubmit={handleUpdate}
      isEditMode={true}
      schema={schema}
      fields={fields}
      modelName={modelName}
    />
  );
};