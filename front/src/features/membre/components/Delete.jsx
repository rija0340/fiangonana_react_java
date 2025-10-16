import api  from "../services/api";
import GenericDelete from "../../../components/common/GenericDelete";
import { useNavigate, useParams } from "react-router-dom";

 const Delete = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    return (
      <GenericDelete ressource="membres" ressourceApi={api} id={id} navigate={navigate} />
    );
};
export default Delete;