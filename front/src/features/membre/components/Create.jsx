import  membreApi  from "../services/api";
import { GenericCreation } from "../../../components/common/GenericCreation";
import { schema, fields, config } from "../utils/formConfig";

const Create = () => {
  return (
    <GenericCreation
      modelName={config.modelName}
      apiCreate={membreApi.create}
      schema={schema}
      fields={fields}
      navigateTo={config.navigateTo}
    />
  );
};

export default Create;