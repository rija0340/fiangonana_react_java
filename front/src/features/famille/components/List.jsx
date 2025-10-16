import { useState } from 'react';
import familleApi from '../services/api';
import membreApi from '../../membre/services/api';
import GenericList from '../../../components/common/GenericList';
import ModalAddMembre from '../../../components/famille/ModalAddMembre';

const List = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [selectedFamilleId, setSelectedFamilleId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger refresh

    const headers = [
        { label: 'Nom', field: 'nom' },
        { label: 'Adresse', field: 'adresse' },
        { label: 'Observation', field: 'observation' },
        { label: 'Nombre de membres', field: 'membres', isSpecial: true },
    ];

    const handleAddMembers = async (familleId) => {
        setSelectedFamilleId(familleId);
        setSearchTerm('');
        setSelectedMembers([]);
        
        // Load all members automatically when modal opens
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
        
        setIsModalOpen(true);
    };

    // Handle search term change for filtering the member list
    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
    };

    const handleSelectMember = (memberId) => {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const handleRemoveSelectedMember = (memberId) => {
        setSelectedMembers(prev => prev.filter(id => id !== memberId));
    };

    const handleAddMembersToFamille = async () => {
        try {
            await familleApi.addMembers(selectedFamilleId, selectedMembers);
            setIsModalOpen(false);
            // Optionally show a success message
            // Trigger a refresh of the famille list to show updated member count
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error adding members to family:', error);
            // Optionally show an error message
        }
    };

    // Get member by ID for display
    const getMemberById = (id) => {
        return members.find(m => m.id === id);
    };

    const handleRemoveMemberFromFamille = async (familleId, memberId) => {
        try {
            await familleApi.removeMember(familleId, memberId);
            // Trigger a refresh of the famille list to show updated member count
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error removing member from famille:', error);
            // Optionally show an error message
        }
    };

    return (
        <div>
            <GenericList
                modelName="famille"
                api={familleApi}
                headers={headers}
                onAddMembers={handleAddMembers}
                refreshTrigger={refreshTrigger}
            />

            {/* Modal for adding members to a family */}
            {isModalOpen && (
                <ModalAddMembre
                    selectedFamilleId={selectedFamilleId}
                    setSelectedFamilleId={setSelectedFamilleId}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    members={members}
                    setMembers={setMembers}
                    selectedMembers={selectedMembers}
                    setSelectedMembers={setSelectedMembers}
                    setIsModalOpen={setIsModalOpen}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    handleSearchChange={handleSearchChange}
                    handleSelectMember={handleSelectMember}
                    handleRemoveSelectedMember={handleRemoveSelectedMember}
                    getMemberById={getMemberById}
                    handleAddMembersToFamille={handleAddMembersToFamille}
                    membreApi={membreApi}
                />
            )}
        </div>
    );
};

export default List;