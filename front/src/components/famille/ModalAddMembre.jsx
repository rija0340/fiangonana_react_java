const ModalAddMembre = ({  
    membreApi,
    searchTerm,
    members, 
    setMembers, 
    selectedMembers,
    setIsModalOpen,
    isLoading,
    setIsLoading,
    handleSearchChange,
    handleSelectMember,
    handleRemoveSelectedMember,
    getMemberById,
    handleAddMembersToFamille
    }) => {

    return (
        <>
            <div className="modal modal-open">
                <div className="modal-box w-11/12 max-w-7xl max-h-screen h-screen">
                    <h3 className="font-bold text-lg">Ajouter des membres à la famille</h3>
                    
                    {/* Selected members */}
                    {selectedMembers.length > 0 && (
                        <div className="form-control my-4">
                            <label className="label">
                                <span className="label-text">Membres sélectionnés ({selectedMembers.length})</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {selectedMembers.map((id) => {
                                    const member = getMemberById(id);
                                    return (
                                        <div key={id} className="badge badge-lg badge-primary gap-2 p-4">
                                            <div className="flex items-center">
                                                <div className="avatar mr-2">
                                                    <div className="mask mask-squircle w-6 h-6">
                                                        <img 
                                                            src="https://img.daisyui.com/images/profile/demo/2@94.webp" 
                                                            alt="Avatar" 
                                                        />
                                                    </div>
                                                </div>
                                                <span>
                                                    {member ? `${member.nom || ''} ${member.prenom || ''}`.trim() : `ID: ${id}`}
                                                </span>
                                            </div>
                                            <button 
                                                type="button"
                                                className="btn btn-circle btn-xs"
                                                onClick={() => handleRemoveSelectedMember(id)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Members list */}
                    <div className="form-control my-4">
                        <label className="label">
                            <span className="label-text">Sélectionner les membres</span>
                        </label>
                        <div className="max-h-full overflow-y-auto">
                            {/* Search input for filtering the list */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Rechercher un membre par nom ou prénom..."
                                    className="input input-bordered w-full"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            
                            {/* Fetch and display all members */}
                            {!members.length > 0 && (
                            <button 
                                className="btn btn-outline mb-4"
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        const response = await membreApi.getAll();
                                        const data = response.data || response;
                                        setMembers(data);
                                    } catch (error) {
                                        console.error('Error fetching members:', error);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    "Charger tous les membres"
                                )}
                            </button> )
                            }
                            
                            {members.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Nom & Prénom</th>
                                                <th>Occupation</th>
                                                <th>Téléphone</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members
                                                .filter(member => {
                                                    if (!searchTerm) return true;
                                                    const fullName = `${member.nom || ''} ${member.prenom || ''}`.toLowerCase();
                                                    return fullName.includes(searchTerm.toLowerCase());
                                                })
                                                .map((member) => (
                                                    <tr key={member.id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox"
                                                                checked={selectedMembers.includes(member.id)}
                                                                onChange={() => handleSelectMember(member.id)}
                                                            />
                                                        </td>
                                                        <td>
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
                                                                    <div className="font-bold">
                                                                        {member.nom} {member.prenom}
                                                                    </div>
                                                                    <div className="text-sm opacity-50">
                                                                        {member.situation_matrimoniale || '—'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {member.occupation || '—'}
                                                        </td>
                                                        <td>
                                                            {member.telephone || '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">
                                        {isLoading 
                                            ? "Chargement des membres..." 
                                            : "Cliquez sur \"Charger tous les membres\" pour afficher la liste"}
                                    </p>
                                    {isLoading && (
                                        <progress className="progress progress-primary w-56"></progress>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal actions */}
                    <div className="modal-action">
                        <button 
                            className="btn btn-outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Annuler
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleAddMembersToFamille}
                            disabled={selectedMembers.length === 0}
                        >
                            Ajouter ({selectedMembers.length})
                        </button>
                    </div>
                </div>
            </div>
        
        </>
    );
};

export default ModalAddMembre;