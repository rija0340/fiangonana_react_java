import api from "../services/api";
import { GenericEdition } from "../../../components/common/GenericEdition";
import { schema,fields,config } from "../utils/formConfig";

const Edit = () => {
  return (
    <GenericEdition
      modelName={config.modelName}
      apiGet={api.getById}
      apiUpdate={api.update}
      schema={schema}
      fields={fields}
      navigateTo={config.navigateTo}
    />
  );
};

export default Edit;
