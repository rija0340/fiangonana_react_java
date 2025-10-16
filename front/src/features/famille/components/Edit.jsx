import familleApi from "../services/api";
import { GenericEdition } from "../../../components/common/GenericEdition";
import { schema, fields, config } from "../utils/formConfig";

const Edit = () => {
  return (
    <GenericEdition
      modelName={config.modelName}
      apiGet={familleApi.getById}
      apiUpdate={familleApi.update}
      schema={schema}
      fields={fields}
      navigateTo={config.navigateTo}
    />
  );
};

export default Edit;