import kilasyApi from '../../api/kilasy';
import GenericList from './../../components/common/GenericList';

const KilasyList = () => {
    const headers = [
        { label: 'Nom', field: 'nom' },
        // { label: 'Adresse', field: 'adresse' },
        // { label: 'Observation', field: 'observation' },
    ];

    return (
        <GenericList
            modelName="kilasy"
            api={kilasyApi}
            headers={headers}
        />
    );
};

export default KilasyList;