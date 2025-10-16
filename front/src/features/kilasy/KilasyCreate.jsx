import kilasyApi from "../../api/kilasy";
import { GenericCreation } from "../../components/common/GenericCreation";
import { kilasySchema, kilasyFields, kilasyConfig } from "./kilasyConfig";

const KilasyCreate = () => {
  return (
    <GenericCreation
      modelName={kilasyConfig.modelName}
      apiCreate={kilasyApi.create}
      schema={kilasySchema}
      fields={kilasyFields}
      navigateTo={kilasyConfig.navigateTo}
    />
  );
};

export default KilasyCreate;
