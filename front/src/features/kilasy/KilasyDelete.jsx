import kilasyApi from "../../api/kilasy";
import GenericDelete from "../../components/common/GenericDelete";
import { useNavigate, useParams } from "react-router-dom";

const KilasyDelete = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    return (
      <GenericDelete ressource="kilasys" ressourceApi={kilasyApi} id={id} navigate={navigate} />
    );
};

export default KilasyDelete;
