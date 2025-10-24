import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const MembreList = () => {
    
    const [membres, setMembres] = useState([]);
    const [selectedMembreId, setSelectedMembreId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        sexe: "all",
        baptise: "all",
        categorie: "all",
    });
    
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch members
        api.getAll(filters).then(response => {
            const data = response;
            setMembres(data);
        }).catch(error => {
            console.error('Error fetching membres:', error);
        });
        
        // Fetch categories for the filter
        api.getCategories().then(response => {
            setCategories(response);
        }).catch(error => {
            console.error('Error fetching categories:', error);
        });
    }, [filters]);


    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        // if (onFilterChange) onFilterChange(newFilters);
    };


    const handleEditMembre = (membreId) => {
        navigate(`/membres/edit/${membreId}`);
    };

    const handleCreateMembre = () => {
        navigate('/membres/new');
    };

    const handleDeleteMembre = (membreId) => {
        api.delete(membreId)
            .then(() => {
                // Refresh the list after successful deletion
                setMembres(prevMembres => prevMembres.filter(membre => membre.id !== membreId));
                // Close the modal after successful deletion
                document.getElementById('my_modal_1').close();
            })
            .catch(error => {
                console.error('Error deleting membre:', error);
                // Close the modal even if there's an error
                document.getElementById('my_modal_1').close();
            });
    };

    const handleImportMembre = () => {
        navigate('/membres/import-xslx');
    };

    return (
        <div className="overflow-x-auto m-6 card shadow-xl bg-base-100">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-2xl">Liste des membres</h2>
                    <div className="flex gap-2">
                        <button onClick={handleCreateMembre} className="btn btn-primary">
                            Ajouter un membre
                        </button>
                        <button onClick={handleImportMembre} className="btn btn-secondary">
                            Importer des membres
                        </button>
                    </div>
                </div>
                    <div className="p-4 bg-base-300 border border-base-300 mb-5">
                        <h2 className="text-lg font-semibold mb-3">Filtrer les membres</h2>

                        {/* Search */}
                        <div className="form-control mb-4">
                            <label className="label">
                            <span className="label-text">Nom ou Prénom</span>
                            </label>
                            <input
                            type="text"
                            placeholder="Rechercher..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="input input-bordered w-full"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Sexe Filter */}
                            <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Sexe</span>
                            </label>
                            <div className="flex gap-4">
                                {["all", "homme", "femme"].map((value) => (
                                <label key={value} className="label cursor-pointer">
                                    <input
                                    type="radio"
                                    name="sexe"
                                    className="radio radio-primary"
                                    checked={filters.sexe === value}
                                    onChange={() => handleFilterChange("sexe", value)}
                                    />
                                    <span className="label-text capitalize ml-2">{value}</span>
                                </label>
                                ))}
                            </div>
                            </div>

                            {/* Baptisé(e) Filter */}
                            <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Baptisé(e)</span>
                            </label>
                            <div className="flex gap-4">
                                {[
                                { label: "all", value: "all" },
                                { label: "baptisé", value: "true" },
                                { label: "non baptisé", value: "false" },
                                ].map((item) => (
                                <label key={item.value} className="label cursor-pointer">
                                    <input
                                    type="radio"
                                    name="baptise"
                                    className="radio radio-secondary"
                                    checked={filters.baptise === item.value}
                                    onChange={() => handleFilterChange("baptise", item.value)}
                                    />
                                    <span className="label-text capitalize ml-2">{item.label}</span>
                                </label>
                                ))}
                            </div>
                            </div>
                            
                            {/* Categorie Filter */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Catégorie</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={filters.categorie}
                                    onChange={(e) => handleFilterChange("categorie", e.target.value)}
                                >
                                    <option value="all">Toutes les catégories</option>
                                    <option value="non_categorie">Non catégorisé</option>
                                    <option value="categorie">Catégorisé</option>
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        </div>
                {membres.length > 0 && (
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <div className="stat bg-accent text-primary-content p-4 rounded-box">
                                <div className="stat-figure text-3xl">♂</div>
                                <div className="stat-title">Total</div>
                                <div className="stat-value">{membres.length}</div>
                            </div>
                            <div className="stat bg-primary text-primary-content p-4 rounded-box">
                                <div className="stat-figure text-3xl">♂</div>
                                <div className="stat-title">Masculin</div>
                                <div className="stat-value">{membres.filter(membre => membre.sexe?.toLowerCase() === 'homme' || membre.sexe?.toLowerCase() === 'm').length}</div>
                            </div>
                            <div className="stat bg-secondary text-secondary-content p-4 rounded-box">
                                <div className="stat-figure text-3xl">♀</div>
                                <div className="stat-title">Féminin</div>
                                <div className="stat-value">{membres.filter(membre => membre.sexe?.toLowerCase() === 'femme' || membre.sexe?.toLowerCase() === 'f').length}</div>
                            </div>
                            <div className="stat bg-accent text-accent-content p-4 rounded-box">
                                <div className="stat-figure text-3xl">✝</div>
                                <div className="stat-title">Baptisé(e)s</div>
                                <div className="stat-value">{membres.filter(membre => membre.date_bapteme !== null && membre.date_bapteme !== undefined && membre.date_bapteme !== '').length}</div>
                            </div>
                            <div className="stat bg-primary text-accent-content p-4 rounded-box">
                                <div className="stat-figure text-3xl">✝</div>
                                <div className="stat-title">Nont Baptisé(e)s</div>
                                <div className="stat-value">{membres.filter(membre => membre.date_bapteme == null).length}</div>
                            </div>
                        </div>
                    </div>
                )}
                <table className="table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Nom</th>
                            <th>prenom</th>
                            <th>Sexe</th>
                            <th className="text-center">Baptisé(e)</th>
                             <th className="text-center">Categorie</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {membres.map((membre) => (
                            <tr key={membre.id}>
                                <th>
                                    <input type="checkbox" className="checkbox" />
                                </th>
                                <td>{membre.nom || '—'}</td>
                                <td>{membre.prenom || '—'}</td>
                                {/* <td>{membre.famille ? membre.famille.nom : '—'}</td> */}
                                <td>{membre.sexe || '—'}</td>
                                <td className="text-center">
                                    {membre.date_bapteme && membre.date_bapteme !== '' ? <span className="badge badge-success">baptisé</span> : <span className="badge badge-error">non-baptisé</span>}
                                </td>
                                <td className="text-center">{membre.categorie || '—'}</td>
                                <td>
                                    {membre.source === 'manuel' && (

                                        <div className="flex justify-center">
                                        <button
                                            onClick={() => handleEditMembre(membre.id)}
                                            className="btn btn-outline btn-success mr-1"
                                            >
                                            Modifier
                                        </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMembreId(membre.id);
                                                    document.getElementById('my_modal_1').showModal();
                                                }}
                                                className="btn btn-outline btn-error"
                                            >
                                                Supprimer
                                            </button>
                                        ) : (
                                            <button
                                                className=""
                                                disabled
                                            >
                                                Supprimer
                                            </button>
                                    </div>
                                        )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th></th>
                            <th>Nom</th>
                            <th>prenom</th>
                            {/* <th>Famille</th> */}
                            <th>Sexe</th>
                            <th className="text-center">Baptisé(e)</th>
                            <th className="text-center">Categorie</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                </table>
                
                {/* Delete confirmation modal */}
                <dialog id="my_modal_1" className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Confirmation</h3>
                        <p className="py-4">Êtes-vous sûr de vouloir supprimer ce membre ?</p>
                        <div className="modal-action">
                            <button 
                                className="btn btn-error"
                                onClick={() => selectedMembreId && handleDeleteMembre(selectedMembreId)}
                            >
                                Oui
                            </button>
                            <form method="dialog">
                                <button className="btn">Annuler</button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
    );
};

export default MembreList;
