import kilasyApi from "../../api/kilasy";
import { GenericEdition } from "../../components/common/GenericEdition";
import { kilasySchema, kilasyFields, kilasyConfig } from "./kilasyConfig";

const KilasyEdit = () => {
  return (
    <GenericEdition
      modelName={kilasyConfig.modelName}
      apiGet={kilasyApi.getById}
      apiUpdate={kilasyApi.update}
      schema={kilasySchema}
      fields={kilasyFields}
      navigateTo={kilasyConfig.navigateTo}
    />
  );
};

export default KilasyEdit;
