import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const GenericList = ({ modelName, api, headers, onAddMembers, onImportMembres, refreshTrigger, showStats, statsConfig }) => {
    const [items, setItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [expandedFamilyId, setExpandedFamilyId] = useState(null); // For expanding family members
    const navigate = useNavigate();

    useEffect(() => {
        api.getAll().then(response => {
            const data = response;
            setItems(data);
        }).catch(error => {
            console.error(`Error fetching ${modelName}s:`, error);
        });
    }, [api, modelName, refreshTrigger]);

    const handleEditItem = (itemId) => {
        navigate(`/${modelName}s/edit/${itemId}`);
    };

    const handleCreateItem = () => {
        navigate(`/${modelName}s/new`);
    };

    const handleDeleteItem = (itemId) => {
        api.delete(itemId)
            .then(() => {
                // Refresh the list after successful deletion
                setItems(prevItems => prevItems.filter(item => item.id !== itemId));
                // Close the modal after successful deletion
                document.getElementById('my_modal_1').close();
            })
            .catch(error => {
                console.error(`Error deleting ${modelName}:`, error);
                // Close the modal even if there's an error
                document.getElementById('my_modal_1').close();
            });
    };

    // Toggle family member display
    const toggleFamilyMembers = (familyId) => {
        setExpandedFamilyId(expandedFamilyId === familyId ? null : familyId);
    };

    return (
        <div className="overflow-x-auto m-6 card shadow-xl bg-base-100">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-2xl">Liste des {modelName}s</h2>
                    <div className="flex gap-2">
                        <button onClick={handleCreateItem} className="btn btn-primary">
                            Ajouter un {modelName}
                        </button>
                        {/* Remove member-specific import button - it should be handled by parent components */}
                    </div>
                </div>
                
                {/* Remove member-specific statistics - it should be handled by parent components */}
                <table className="table">
                    <thead>
                        <tr>
                            <th></th>
                            {headers.map((header, index) => (
                                <th key={index}>{header.label}</th>
                            ))}
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <>
                                <tr key={item.id}>
                                    <th>
                                        <input type="checkbox" className="checkbox" />
                                    </th>
                                    {headers.map((header) => (
                                        <td key={header.field}>
                                            <div className={header.field === 'description' ? 'max-w-xs truncate' : ''}>
                                                {header.render
                                                    ? header.render(item[header.field])
                                                    : header.isSpecial && (header.field === 'mambras' || header.field === 'membres')
                                                        ? (item[header.field] ? item[header.field].length : 0)
                                                        : (item[header.field] || '—')}
                                            </div>
                                        </td>
                                    ))}
                                    <th>
                                        <div className="flex justify-center">
                                            {modelName === 'famille' && onAddMembers && (
                                                <button
                                                    onClick={() => onAddMembers(item.id)}
                                                    className="btn btn-outline btn-info mr-1"
                                                >
                                                    Ajouter des membres
                                                </button>
                                            )}
                                            {modelName === 'famille' && item.membres && item.membres.length > 0 && (
                                                <button
                                                    onClick={() => toggleFamilyMembers(item.id)}
                                                    className="btn btn-outline btn-secondary mr-1"
                                                >
                                                    {expandedFamilyId === item.id ? 'Cacher membres' : 'Voir membres'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditItem(item.id)}
                                                className="btn btn-outline btn-success mr-1"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedItemId(item.id);
                                                    document.getElementById('my_modal_1').showModal();
                                                }}
                                                className="btn btn-outline btn-error"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                                {/* Expanded row for family members */}
                                {modelName === 'famille' && expandedFamilyId === item.id && item.membres && item.membres.length > 0 && (
                                    <tr>
                                        <td colSpan={headers.length + 2} className="p-0">
                                            <div className="bg-base-200 p-4">
                                                <h4 className="font-bold mb-2">Membres de la famille:</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {item.membres.map((member) => (
                                                        <div key={member.id} className="card card-side bg-base-100 shadow-xl">
                                                            <div className="card-body p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="avatar">
                                                                        <div className="mask mask-squircle w-12 h-12">
                                                                            <img 
                                                                                src="https://img.daisyui.com/images/profile/demo/2@94.webp" 
                                                                                alt="Avatar" 
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-bold">{member.nom} {member.prenom}</h3>
                                                                        <p className="text-sm">{member.occupation || 'Occupation non spécifiée'}</p>
                                                                        <p className="text-xs opacity-70">{member.situation_matrimoniale || '—'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="card-actions justify-end">
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (window.confirm(`Êtes-vous sûr de vouloir retirer ${member.nom} ${member.prenom} de cette famille ?`)) {
                                                                                try {
                                                                                    await api.removeMember(item.id, member.id);
                                                                                    // Refresh the list after successful removal
                                                                                    setItems(prevItems => 
                                                                                        prevItems.map(famille => 
                                                                                            famille.id === item.id 
                                                                                                ? {...famille, membres: famille.membres.filter(m => m.id !== member.id)}
                                                                                                : famille
                                                                                        )
                                                                                    );
                                                                                } catch (error) {
                                                                                    console.error('Error removing member from family:', error);
                                                                                    alert('Erreur lors de la suppression du membre: ' + (error.response?.data?.message || error.message));
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="btn btn-outline btn-error btn-sm"
                                                                    >
                                                                        Retirer
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th></th>
                            {headers.map((header, index) => (
                                <th key={index}>{header.label}</th>
                            ))}
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <dialog id="my_modal_1" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-red-500">Suppression!</h3>
                    <p className="py-4">Êtes-vous sûr de vouloir supprimer ce {modelName} ?</p>
                    <div className="modal-action">
                        <button
                            onClick={() => handleDeleteItem(selectedItemId)}
                            className="btn btn-outline btn-error"
                        >
                            Supprimer
                        </button>
                        <form method="dialog">
                            <button className="btn">Annuler</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default GenericList;