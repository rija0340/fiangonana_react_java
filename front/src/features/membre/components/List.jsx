import api  from '../services/api';
import { useNavigate } from 'react-router-dom';
import GenericList from '../../../components/common/GenericList';

const MembreList = () => {
    const navigate = useNavigate();

    const headers = [
        { label: 'Nom', field: 'nom' },
        { label: 'prenom', field: 'prenom' },
        { label: 'Famille', field: 'famille' },
        { label: 'Sexe', field: 'sexe' },
        { 
            label: 'Baptisé(e)', 
            field: 'date_bapteme',
            isSpecial: true,
            render: (value) => value && value !== '' ? '✓' : '✗' 
        },
    ];

    const handleImportMembre = () => {
        navigate('/membres/import-xslx');
    }

    return (
        <GenericList
            modelName="membre"
            api={api}
            headers={headers}
            onImportMembres={handleImportMembre}
        />
    );
};

export default MembreList;
