// État de l'application
let planning = {
    nom: '',
    datesSelectionnees: [], // Array of selected dates
    membresAssignables: [], // Array of members that can be assigned to this planning
    rolesParTypeJour: {}, // {typeJour: [roles]}
    assignments: [], // [{date, typeJour, role, membre}]
    typeJourDates: {} // {typeJour: [dates]} - mapping each day type to corresponding dates
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    chargerDonnees();
    afficherListes();
    initialiserDatePickers();
});

// ===== INITIALISATION DES DATE PICKERS =====

function initialiserDatePickers() {
    // Mock de membres existants pour notre démonstration
    const membresExistant = [
        { id: 1, nom: 'Rakoto', prenom: 'Jean' },
        { id: 2, nom: 'Rabe', prenom: 'Marie' },
        { id: 3, nom: 'Andria', prenom: 'Pierre' },
        { id: 4, nom: 'Rasolo', prenom: 'Sophie' },
        { id: 5, nom: 'Randria', prenom: 'Claude' },
        { id: 6, nom: 'Ratsim', prenom: 'Michel' },
        { id: 7, nom: 'Andriam', prenom: 'Nathalie' },
        { id: 8, nom: 'Rabeari', prenom: 'Thomas' }
    ];
    
    // Afficher les membres existants pour la sélection
    afficherMembresExistant(membresExistant);
    
    // Initialiser le date picker
    const dateInput = document.getElementById('datePicker');
    dateInput.addEventListener('click', afficherCalendrier);
    
    // Cacher le calendrier quand on clique ailleurs
    document.addEventListener('click', function(event) {
        const datePicker = document.getElementById('datePicker');
        const calendar = document.getElementById('calendar');
        if (!datePicker.contains(event.target) && !calendar.contains(event.target)) {
            calendar.style.display = 'none';
        }
    });
}

function afficherMembresExistant(membres) {
    const container = document.getElementById('membresDisponiblesContainer');
    container.innerHTML = '';
    
    membres.forEach(membre => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 mb-2';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `membre-${membre.id}`;
        checkbox.value = membre.id;
        checkbox.className = 'mr-2';
        
        const label = document.createElement('label');
        label.htmlFor = `membre-${membre.id}`;
        label.textContent = `${membre.nom} ${membre.prenom}`;
        label.className = 'cursor-pointer';
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

function afficherCalendrier() {
    const calendar = document.getElementById('calendar');
    calendar.style.display = 'block';
    
    // Générer un calendrier simple pour la sélection de dates
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const calendarContent = document.getElementById('calendarContent');
    calendarContent.innerHTML = genererCalendrierMois(currentYear, currentMonth);
    
    // Ajouter des événements pour les dates
    document.querySelectorAll('.calendar-date').forEach(dateElement => {
        dateElement.addEventListener('click', function() {
            const dateStr = this.dataset.date;
            basculerDateSelectionnee(dateStr);
        });
    });
}

function genererCalendrierMois(year, month) {
    const date = new Date(year, month, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Lundi de la première semaine
    
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Dimanche de la dernière semaine
    
    let html = '<div class="calendar-header text-center font-bold mb-2">';
    html += `${getMonthName(date.getMonth())} ${date.getFullYear()}`;
    html += '</div>';
    
    html += '<div class="grid grid-cols-7 gap-1 mb-2">';
    const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    joursSemaine.forEach(jour => {
        html += `<div class="text-center text-sm font-semibold py-1">${jour}</div>`;
    });
    html += '</div>';
    
    html += '<div class="grid grid-cols-7 gap-1">';
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const isCurrentMonth = currentDate.getMonth() === month;
        const dateStr = currentDate.toISOString().split('T')[0];
        const isSelected = planning.datesSelectionnees.includes(dateStr);
        
        const dayClass = `calendar-date text-center py-2 rounded cursor-pointer text-sm ${
            isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'
        } ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`;
        
        html += `<div class="${dayClass}" data-date="${dateStr}">${currentDate.getDate()}</div>`;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    html += '</div>';
    
    return html;
}

function getMonthName(monthIndex) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthIndex];
}

function basculerDateSelectionnee(dateStr) {
    const index = planning.datesSelectionnees.indexOf(dateStr);
    if (index === -1) {
        planning.datesSelectionnees.push(dateStr);
    } else {
        planning.datesSelectionnees.splice(index, 1);
    }
    
    sauvegarderDonnees();
    afficherDatesSelectionnees();
    grouperDatesParTypeJour();
}

function afficherDatesSelectionnees() {
    const container = document.getElementById('selectedDatesDisplay');
    container.innerHTML = '';
    
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const jourNom = getJourNom(date.getDay());
        
        const span = document.createElement('span');
        span.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2';
        span.innerHTML = `
            <span>${jourNom} ${dateStr}</span>
            <button onclick="retirerDateSelectionnee('${dateStr}')" class="text-blue-600 hover:text-blue-800">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(span);
    });
}

function getJourNom(dayIndex) {
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return jours[dayIndex];
}

function retirerDateSelectionnee(dateStr) {
    planning.datesSelectionnees = planning.datesSelectionnees.filter(d => d !== dateStr);
    sauvegarderDonnees();
    afficherDatesSelectionnees();
    grouperDatesParTypeJour();
}

// ===== GESTION DES TYPES DE JOURS =====

function grouperDatesParTypeJour() {
    // Réinitialiser le mapping
    planning.typeJourDates = {
        'Lundi': [],
        'Mardi': [],
        'Mercredi': [],
        'Jeudi': [],
        'Vendredi': [],
        'Samedi': [],
        'Dimanche': []
    };
    
    // Pour chaque date sélectionnée, déterminer le type de jour et l'ajouter au groupe approprié
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const dayIndex = date.getDay();
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const typeJour = jours[dayIndex];
        
        if (planning.typeJourDates[typeJour]) {
            planning.typeJourDates[typeJour].push(dateStr);
        }
    });
    
    afficherListes();
}

// ===== GESTION DE L'INTERFACE =====

function toggleConfig() {
    const section = document.getElementById('configSection');
    const toggle = document.getElementById('configToggle');

    if (section.classList.contains('config-expanded')) {
        section.classList.remove('config-expanded');
        section.classList.add('config-collapsed');
        toggle.classList.add('rotate-180');
    } else {
        section.classList.remove('config-collapsed');
        section.classList.add('config-expanded');
        toggle.classList.remove('rotate-180');
    }
}

function switchTab(tabName) {
    // Cacher tous les contenus
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Enlever active de tous les boutons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Afficher le contenu sélectionné
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    // Activer le bouton
    event.target.classList.add('active');

    // Rafraîchir les données selon l'onglet
    if (tabName === 'statistiques') {
        initialiserFiltresStats();
        afficherStatsAvancees();
    }
}

// ===== AJOUT DE DONNÉES =====

function ajouterRolesTypeJour() {
    const typeJour = document.getElementById('typeJourRole').value;
    const rolesText = document.getElementById('rolesTypeJour').value.trim();

    if (!typeJour) {
        afficherMessage('Veuillez sélectionner un type de jour', 'error', 'messageConfigurer');
        return;
    }

    if (!rolesText) {
        afficherMessage('Veuillez entrer au moins un rôle', 'error', 'messageConfigurer');
        return;
    }

    const rolesArray = rolesText.split('\n').map(r => r.trim()).filter(r => r);
    
    if (!planning.rolesParTypeJour[typeJour]) {
        planning.rolesParTypeJour[typeJour] = [];
    }
    
    // Ajouter les nouveaux rôles sans doublons
    rolesArray.forEach(role => {
        if (!planning.rolesParTypeJour[typeJour].includes(role)) {
            planning.rolesParTypeJour[typeJour].push(role);
        }
    });

    document.getElementById('rolesTypeJour').value = '';

    sauvegarderDonnees();
    afficherListes();

    afficherMessage(`Rôles ajoutés pour ${typeJour}: ${rolesArray.length} rôle(s)`, 'success', 'messageConfigurer');
}

function enregistrerMembresAssignables() {
    const checkboxes = document.querySelectorAll('#membresDisponiblesContainer input[type="checkbox"]:checked');
    const idsSelectionnes = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Pour cet exemple, on va créer des objets membres simples
    const membresSelectionnes = [];
    for (const id of idsSelectionnes) {
        // Dans la vraie application, on récupérerait les détails des membres
        // Pour le moment, on crée des mocks
        membresSelectionnes.push({
            id: id,
            nom: `Membre${id}`,
            prenom: `Prenom${id}`,
            disponibilites: [] // Sera rempli plus tard
        });
    }
    
    planning.membresAssignables = membresSelectionnes;
    
    sauvegarderDonnees();
    afficherListes();
    mettreAJourSelects();

    afficherMessage(`${membresSelectionnes.length} membre(s) enregistré(s) comme assignables`, 'success', 'messageConfigurer');
}

// ===== MODIFICATION =====

function chargerDisponibilitesMembre() {
    const membreId = document.getElementById('membreDisponibilite').value;
    const container = document.getElementById('disponibilitesMembreContainer');
    const liste = document.getElementById('listeDisponibilitesMembre');

    if (!membreId) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    const membre = planning.membresAssignables.find(m => m.id == membreId);
    if (!membre) return;

    liste.innerHTML = '';
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const jourNom = getJourNom(date.getDay());
        
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 mb-1';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `dispo-${membreId}-${dateStr}`;
        checkbox.checked = membre.disponibilites.includes(dateStr);
        checkbox.onchange = () => {
            modifierDisponibiliteMembre(membreId, dateStr, checkbox.checked);
        };

        const label = document.createElement('label');
        label.htmlFor = `dispo-${membreId}-${dateStr}`;
        label.textContent = `${jourNom} ${dateStr}`;
        label.className = 'cursor-pointer';

        div.appendChild(checkbox);
        div.appendChild(label);
        liste.appendChild(div);
    });
}

function modifierDisponibiliteMembre(membreId, dateStr, estDisponible) {
    const membre = planning.membresAssignables.find(m => m.id == membreId);
    if (!membre) return;

    if (estDisponible) {
        if (!membre.disponibilites.includes(dateStr)) {
            membre.disponibilites.push(dateStr);
        }
    } else {
        membre.disponibilites = membre.disponibilites.filter(d => d !== dateStr);
    }

    sauvegarderDonnees();
    afficherListes();
}

// ===== AFFICHAGE =====

function afficherListes() {
    afficherListeTypesJours();
    afficherListeRolesParType();
    afficherListeMembresAssignables();
    grouperDatesParTypeJour(); // Actualiser le groupement des dates
}

function afficherListeTypesJours() {
    const liste = document.getElementById('listeTypesJours');
    liste.innerHTML = '';

    if (Object.keys(planning.typeJourDates).length === 0) {
        liste.innerHTML = '<p class="text-gray-400 text-sm">Aucun type de jour configuré</p>';
        return;
    }

    Object.entries(planning.typeJourDates).forEach(([typeJour, dates]) => {
        if (dates.length > 0) {
            const div = document.createElement('div');
            div.className = 'bg-blue-50 p-3 rounded-lg';
            div.innerHTML = `
                <div class="font-semibold text-gray-700">${typeJour}</div>
                <div class="text-xs text-gray-600">${dates.length} date(s)</div>
            `;
            liste.appendChild(div);
        }
    });
}

function afficherListeRolesParType() {
    const liste = document.getElementById('listeRolesParType');
    liste.innerHTML = '';

    if (Object.keys(planning.rolesParTypeJour).length === 0) {
        liste.innerHTML = '<p class="text-gray-400 text-sm">Aucun rôle configuré</p>';
        return;
    }

    Object.entries(planning.rolesParTypeJour).forEach(([typeJour, roles]) => {
        if (roles.length > 0) {
            const div = document.createElement('div');
            div.className = 'bg-purple-50 p-3 rounded-lg';

            const titre = document.createElement('div');
            titre.className = 'font-semibold text-gray-700 mb-2';
            titre.textContent = typeJour;

            const rolesDiv = document.createElement('div');
            rolesDiv.className = 'flex flex-wrap gap-1';

            roles.forEach(role => {
                const badge = document.createElement('span');
                badge.className = 'text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full';
                badge.textContent = role;
                rolesDiv.appendChild(badge);
            });

            div.appendChild(titre);
            div.appendChild(rolesDiv);
            liste.appendChild(div);
        }
    });
}

function afficherListeMembresAssignables() {
    const liste = document.getElementById('listeMembresAssignables');
    liste.innerHTML = '';

    if (planning.membresAssignables.length === 0) {
        liste.innerHTML = '<p class="text-gray-400 text-sm">Aucun membre sélectionné</p>';
        return;
    }

    planning.membresAssignables.forEach(membre => {
        const div = document.createElement('div');
        div.className = 'bg-green-50 p-3 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-gray-700">${membre.nom} ${membre.prenom}</span>
            </div>
            <div class="text-xs text-gray-600">
                <i class="fas fa-calendar-check mr-1"></i>
                ${membre.disponibilites.length} date(s) disponible(s)
            </div>
        `;
        liste.appendChild(div);
    });
}

function mettreAJourSelects() {
    // Select membre pour disponibilité
    const selectMembre = document.getElementById('membreDisponibilite');
    selectMembre.innerHTML = '<option value="">-- Sélectionner un membre --</option>';
    planning.membresAssignables.forEach(membre => {
        const option = document.createElement('option');
        option.value = membre.id;
        option.textContent = `${membre.nom} ${membre.prenom}`;
        selectMembre.appendChild(option);
    });
}

function afficherMessage(message, type, targetDiv = 'messagePlanning') {
    const messageDiv = document.getElementById(targetDiv);
    messageDiv.className = `p-4 rounded-lg mb-4 ${
        type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
        type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
        'bg-blue-100 text-blue-800 border border-blue-300'
    }`;
    messageDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;

    setTimeout(() => {
        messageDiv.innerHTML = '';
        messageDiv.className = '';
    }, 5000);
}

// ===== GÉNÉRATION DU PLANNING =====

function genererPlanningAutomatique() {
    if (planning.datesSelectionnees.length === 0) {
        afficherMessage('Veuillez d\'abord sélectionner des dates', 'error', 'messageConfigurer');
        return;
    }

    if (Object.keys(planning.rolesParTypeJour).length === 0) {
        afficherMessage('Veuillez d\'abord configurer des rôles par type de jour', 'error', 'messageConfigurer');
        return;
    }

    if (planning.membresAssignables.length === 0) {
        afficherMessage('Veuillez d\'abord sélectionner des membres assignables', 'error', 'messageConfigurer');
        return;
    }

    // Réinitialiser les assignments précédents
    planning.assignments = [];

    // Parcourir chaque date sélectionnée
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const typeJour = jours[date.getDay()];
        
        // Vérifier s'il y a des rôles définis pour ce type de jour
        if (planning.rolesParTypeJour[typeJour]) {
            planning.rolesParTypeJour[typeJour].forEach(role => {
                // Trouver un membre disponible pour cette date
                const membreDisponible = trouverMembreDisponible(dateStr, role, typeJour);
                
                if (membreDisponible) {
                    planning.assignments.push({
                        date: dateStr,
                        typeJour: typeJour,
                        role: role,
                        membre: membreDisponible,
                        mode: 'auto' // Marqué comme assigné automatiquement
                    });
                }
            });
        }
    });

    afficherTableauPlanning();
    
    afficherMessage(`Planning généré automatiquement pour ${planning.assignments.length} affectations !`, 'success', 'messageConfigurer');
    
    initialiserFiltresStats();
}

function trouverMembreDisponible(dateStr, role, typeJour) {
    // Filtrer les membres assignables qui sont disponibles à cette date
    const membresDisponibles = planning.membresAssignables.filter(membre => 
        membre.disponibilites.includes(dateStr)
    );
    
    if (membresDisponibles.length === 0) {
        return null;
    }
    
    // Règle 1: Privilégier les membres qui n'ont jamais eu ce rôle
    const membresSansRole = membresDisponibles.filter(membre => {
        return !planning.assignments.some(ass => 
            ass.membre.id === membre.id && ass.role === role
        );
    });
    
    if (membresSansRole.length > 0) {
        // Parmi ceux qui n'ont jamais eu ce rôle, choisir celui avec le moins d'assignations
        return trouverMembreAvecMoinsAssignations(membresSansRole, dateStr);
    }
    
    // Règle 2: Parmi les membres disponibles, choisir celui avec le moins d'assignations
    return trouverMembreAvecMoinsAssignations(membresDisponibles, dateStr);
}

function trouverMembreAvecMoinsAssignations(membres, dateStr) {
    // Calculer le nombre d'assignations pour chaque membre
    const membresAvecNbAssignations = membres.map(membre => {
        const nbAssignations = planning.assignments.filter(ass => 
            ass.membre.id === membre.id
        ).length;
        
        // Ajouter aussi les assignations prévues pour cette date (pour éviter plusieurs rôles le même jour)
        const nbAssignationsDate = planning.assignments.filter(ass => 
            ass.membre.id === membre.id && ass.date === dateStr
        ).length;
        
        return {
            membre: membre,
            nbAssignations: nbAssignations,
            nbAssignationsDate: nbAssignationsDate
        };
    });
    
    // Trier par nombre d'assignations (priorité à ceux avec le moins)
    membresAvecNbAssignations.sort((a, b) => {
        // Priorité 1: Moins d'assignations pour cette date (éviter plusieurs rôles le même jour)
        if (a.nbAssignationsDate !== b.nbAssignationsDate) {
            return a.nbAssignationsDate - b.nbAssignationsDate;
        }
        // Priorité 2: Moins d'assignations totales
        return a.nbAssignations - b.nbAssignations;
    });
    
    return membresAvecNbAssignations[0].membre;
}

function genererPlanning() {
    genererPlanningAutomatique();
}

function regenererPlanningAutomatique() {
    // Conserver les assignments manuels
    const assignmentsManuels = planning.assignments.filter(ass => ass.mode === 'manuel');
    
    // Réinitialiser et regénérer
    planning.assignments = assignmentsManuels; // Garder seulement les manuels
    
    // Ré-exécuter la génération automatique
    genererPlanningAutomatique();
    
    // Réintégrer les assignments manuels (potentiellement modifiés)
    afficherTableauPlanning();
}

function afficherTableauPlanning() {
    const table = document.getElementById('tableauPlanning');
    
    // Générer l'en-tête avec les dates
    let headerHTML = '<tr class="desktop-view"><th>Jour</th><th>Rôle</th>';
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const jourNom = getJourNom(date.getDay());
        headerHTML += `<th class="text-center">${jourNom}<br>${dateStr}</th>`;
    });
    headerHTML += '</tr>';

    // Corps du tableau
    let bodyHTML = '';
    
    // Pour chaque type de jour avec des rôles
    Object.entries(planning.rolesParTypeJour).forEach(([typeJour, roles]) => {
        roles.forEach((role, roleIndex) => {
            const isFirstRole = roleIndex === 0;
            const typeJourDates = planning.typeJourDates[typeJour] || [];
            
            // Si ce type de jour a des dates associées
            if (typeJourDates.length > 0) {
                bodyHTML += '<tr class="desktop-view">';

                // Colonne type de jour (avec rowspan pour le premier rôle)
                if (isFirstRole) {
                    bodyHTML += `<td rowspan="${roles.length}" class="font-semibold bg-gray-50 border-r border-gray-300 align-top">${typeJour}</td>`;
                }

                // Colonne rôle
                bodyHTML += `<td class="bg-gray-50 border-r border-gray-300">${role}</td>`;

                // Colonnes pour chaque date
                planning.datesSelectionnees.forEach(dateStr => {
                    // Trouver l'assignment pour cette date, ce rôle
                    const assignment = planning.assignments.find(ass => 
                        ass.date === dateStr && ass.role === role
                    );

                    const membreNom = assignment ? `${assignment.membre.nom} ${assignment.membre.prenom}` : '';
                    const displayText = membreNom || '<span class="empty-cell">Vide</span>';
                    const cellClass = membreNom ? 'editable-cell' : 'editable-cell empty-cell';

                    bodyHTML += `<td class="text-center ${cellClass}"
                        onclick="ouvrirAutocomplete(this, '${dateStr}', '${typeJour}', '${role}')"
                        data-date="${dateStr}"
                        data-typejour="${typeJour}"
                        data-role="${role}"
                        data-membre="${assignment ? assignment.membre.id : ''}">${displayText}</td>`;
                });

                bodyHTML += '</tr>';
            }
        });
    });

    // Vue mobile
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const typeJour = jours[date.getDay()];
        
        bodyHTML += `<tr class="mobile-view"><td colspan="3" class="week-header bg-gray-100 font-bold text-center py-3">${getJourNom(date.getDay())} ${dateStr}</td></tr>`;

        // Afficher les rôles pour ce type de jour
        const rolesPourType = planning.rolesParTypeJour[typeJour] || [];
        rolesPourType.forEach(role => {
            const assignment = planning.assignments.find(ass => 
                ass.date === dateStr && ass.role === role
            );

            const membreNom = assignment ? `${assignment.membre.nom} ${assignment.membre.prenom}` : '';
            const displayText = membreNom || '<span class="empty-cell">Vide</span>';
            const cellClass = membreNom ? 'editable-cell' : 'editable-cell empty-cell';

            bodyHTML += '<tr class="mobile-view">';
            bodyHTML += `<td data-label="Type Jour" class="font-semibold">${typeJour}</td>`;
            bodyHTML += `<td data-label="Rôle">${role}</td>`;
            bodyHTML += `<td data-label="Membre" class="${cellClass}"
                onclick="ouvrirAutocomplete(this, '${dateStr}', '${typeJour}', '${role}')"
                data-date="${dateStr}"
                data-typejour="${typeJour}"
                data-role="${role}"
                data-membre="${assignment ? assignment.membre.id : ''}">${displayText}</td>`;
            bodyHTML += '</tr>';
        });
    });

    table.innerHTML = `<thead>${headerHTML}</thead><tbody>${bodyHTML}</tbody>`;

    // Mettre à jour l'assistant
    mettreAJourAssistant();
}

// ===== ASSISTANT EN TEMPS RÉEL =====

let roleActifSurligne = null;

function mettreAJourAssistant() {
    const panel = document.getElementById('assistantPanel');
    const content = document.getElementById('assistantContent');
    const analyseDiv = document.getElementById('assistantAnalyse');

    if (planning.assignments.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';

    // Initialiser les filtres (checkboxes)
    initialiserFiltresAssistant();

    // Récupérer les filtres sélectionnés
    const membresFiltres = Array.from(document.querySelectorAll('.assistant-filter-membre:checked')).map(cb => parseInt(cb.value));
    const rolesFiltres = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);
    const datesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-date:checked')).map(cb => cb.value);

    // Obtenir tous les rôles uniques
    const tousLesRoles = [...new Set(planning.assignments.map(ass => ass.role))].sort();

    // Construire le tableau récapitulatif
    let html = '<div class="overflow-x-auto">';
    html += '<table class="w-full text-xs border-collapse">';

    // En-tête du tableau
    html += '<thead><tr class="bg-gray-100">';
    html += '<th class="border border-gray-300 p-1 text-left sticky left-0 bg-gray-100 z-10">Membre</th>';
    tousLesRoles.forEach(role => {
        html += `<th class="border border-gray-300 p-1 text-center">${role}</th>`;
    });
    html += '</tr></thead>';

    // Corps du tableau
    html += '<tbody>';
    planning.membresAssignables.filter(m => membresFiltres.includes(m.id)).forEach(membre => {
        html += '<tr class="hover:bg-gray-50">';

        // Colonne nom (cliquable pour surligner)
        html += `<td class="border border-gray-300 p-1 font-semibold sticky left-0 bg-white cursor-pointer hover:bg-blue-50"
                     onclick="surlignerMembre(${membre.id})"
                     title="${membre.disponibilites.join(', ')}"
                     data-label="Membre">${membre.nom} ${membre.prenom}</td>`;

        // Colonnes rôles
        tousLesRoles.forEach(role => {
            // Compter les assignations pour ce rôle (toutes dates)
            const nbAssignations = planning.assignments.filter(ass =>
                ass.membre.id === membre.id &&
                ass.role === role &&
                datesFiltrees.includes(ass.date)
            ).length;

            if (nbAssignations > 0) {
                // Assigné - afficher le nombre en vert (cliquable pour surligner)
                html += `<td class="border border-gray-300 p-1 text-center bg-green-100 cursor-pointer hover:bg-green-200"
                             onclick="surlignerRole(${membre.id}, '${role}')"
                             title="Assigné ${nbAssignations} fois"
                             data-label="${role}">
                            <span class="text-green-800 font-bold">✓ ${nbAssignations}</span>
                         </td>`;
            } else {
                // Non assigné - croix rouge
                html += `<td class="border border-gray-300 p-1 text-center bg-red-50 cursor-pointer hover:bg-red-100"
                             onclick="surlignerRole(${membre.id}, '${role}')"
                             title="Jamais assigné"
                             data-label="${role}">
                            <span class="text-red-600 font-bold">✗</span>
                         </td>`;
            }
        });

        html += '</tr>';
    });
    html += '</tbody></table></div>';

    content.innerHTML = html;

    // Générer l'analyse des rôles jamais assignés
    genererAnalyseRolesNonAssignes(analyseDiv, membresFiltres, rolesFiltres, datesFiltrees);
}

function genererAnalyseRolesNonAssignes(container, membresFiltres, rolesFiltres, datesFiltrees) {
    if (planning.assignments.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4 text-sm">Aucune analyse disponible</div>';
        return;
    }

    // Liste des rôles jamais assignés
    const rolesNonAssignes = [];

    rolesFiltres.forEach(role => {
        const estAssigne = planning.assignments.some(ass =>
            ass.role === role &&
            membresFiltres.includes(ass.membre.id) &&
            datesFiltrees.includes(ass.date)
        );

        if (!estAssigne) {
            rolesNonAssignes.push(role);
        }
    });

    let html = '<div class="text-sm mt-3">';
    html += '<div class="font-semibold text-gray-700 mb-2">🔴 Rôles jamais assignés</div>';

    if (rolesNonAssignes.length > 0) {
        html += '<ul class="text-xs text-gray-600 ml-4 list-disc">';
        rolesNonAssignes.forEach(role => {
            html += `<li>${role}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<div class="text-xs text-gray-500 italic">Tous les rôles ont été assignés</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

function initialiserFiltresAssistant() {
    const containerMembres = document.getElementById('assistantMembresContainer');
    const containerRoles = document.getElementById('assistantRolesContainer');
    const containerDates = document.getElementById('assistantDatesContainer');

    // Obtenir les sélections actuelles avant de réinitialiser
    const selectedMembres = Array.from(document.querySelectorAll('.assistant-filter-membre:checked')).map(cb => parseInt(cb.value));
    const selectedRoles = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);
    const selectedDates = Array.from(document.querySelectorAll('.assistant-filter-date:checked')).map(cb => cb.value);

    // Remplir membres - réinitialiser mais conserver les sélections existantes
    containerMembres.innerHTML = '';
    planning.membresAssignables.forEach(membre => {
        // Si aucune sélection n'existe (première fois), sélectionner par défaut
        const shouldCheck = selectedMembres.length === 0 || selectedMembres.includes(membre.id);
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1.5 mb-0.5 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="assistant-filter-membre cursor-pointer" value="${membre.id}" ${shouldCheck ? 'checked' : ''} onchange="mettreAJourAssistant(); verifierEtatTousCheckbox();">
            <span>${membre.nom} ${membre.prenom}</span>
        `;
        containerMembres.appendChild(label);
    });

    // Remplir rôles - réinitialiser mais conserver les sélections existantes
    containerRoles.innerHTML = '';
    [...new Set(planning.assignments.map(ass => ass.role))].sort().forEach(role => {
        // Si aucune sélection n'existe (première fois), sélectionner par défaut
        const shouldCheck = selectedRoles.length === 0 || selectedRoles.includes(role);
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1.5 mb-0.5 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="assistant-filter-role cursor-pointer" value="${role}" ${shouldCheck ? 'checked' : ''} onchange="mettreAJourAssistant(); verifierEtatTousCheckbox();">
            <span>${role}</span>
        `;
        containerRoles.appendChild(label);
    });

    // Remplir dates - réinitialiser mais conserver les sélections existantes
    containerDates.innerHTML = '';
    planning.datesSelectionnees.forEach(dateStr => {
        // Si aucune sélection n'existe (première fois), sélectionner par défaut
        const shouldCheck = selectedDates.length === 0 || selectedDates.includes(dateStr);
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1.5 mb-0.5 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="assistant-filter-date cursor-pointer" value="${dateStr}" ${shouldCheck ? 'checked' : ''} onchange="mettreAJourAssistant(); verifierEtatTousCheckbox();">
            <span>${dateStr}</span>
        `;
        containerDates.appendChild(label);
    });
}

function toggleAssistantMembres() {
    const checked = document.getElementById('assistantAllMembres').checked;
    document.querySelectorAll('.assistant-filter-membre').forEach(cb => {
        cb.checked = checked;
    });
    mettreAJourAssistant();
}

function toggleAssistantRoles() {
    const checked = document.getElementById('assistantAllRoles').checked;
    document.querySelectorAll('.assistant-filter-role').forEach(cb => {
        cb.checked = checked;
    });
    mettreAJourAssistant();
}

function toggleAssistantDates() {
    const checked = document.getElementById('assistantAllDates').checked;
    document.querySelectorAll('.assistant-filter-date').forEach(cb => {
        cb.checked = checked;
    });
    mettreAJourAssistant();
}

// Fonction pour synchroniser l'état du checkbox "Tous" avec les checkboxes individuels
function verifierEtatTousCheckbox() {
    // Vérifier l'état des membres
    const membresCheckboxes = document.querySelectorAll('.assistant-filter-membre');
    const membresChecked = document.querySelectorAll('.assistant-filter-membre:checked');
    const tousMembres = document.getElementById('assistantAllMembres');
    if (membresCheckboxes.length > 0) {
        tousMembres.checked = membresChecked.length === membresCheckboxes.length;
    } else {
        tousMembres.checked = false;
    }

    // Vérifier l'état des rôles
    const rolesCheckboxes = document.querySelectorAll('.assistant-filter-role');
    const rolesChecked = document.querySelectorAll('.assistant-filter-role:checked');
    const tousRoles = document.getElementById('assistantAllRoles');
    if (rolesCheckboxes.length > 0) {
        tousRoles.checked = rolesChecked.length === rolesCheckboxes.length;
    } else {
        tousRoles.checked = false;
    }

    // Vérifier l'état des dates
    const datesCheckboxes = document.querySelectorAll('.assistant-filter-date');
    const datesChecked = document.querySelectorAll('.assistant-filter-date:checked');
    const tousDates = document.getElementById('assistantAllDates');
    if (datesCheckboxes.length > 0) {
        tousDates.checked = datesChecked.length === datesCheckboxes.length;
    } else {
        tousDates.checked = false;
    }
}

function surlignerCellule(date, typeJour, role, membreId) {
    // Retirer tous les surlignages
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });

    // Surligner la cellule spécifique
    document.querySelectorAll('.editable-cell').forEach(cell => {
        const cellDate = cell.dataset.date;
        const cellTypeJour = cell.dataset.typejour;
        const cellRole = cell.dataset.role;
        const cellMembre = cell.dataset.membre;

        if (cellDate === date && cellTypeJour === typeJour && cellRole === role && cellMembre == membreId) {
            cell.classList.add('highlight-cell');
            // Scroll vers la cellule
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function surlignerMembre(membreId) {
    // Retirer tous les surlignages
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });

    // Surligner toutes les cellules de ce membre selon les filtres actifs
    const membresFiltres = Array.from(document.querySelectorAll('.assistant-filter-membre:checked')).map(cb => parseInt(cb.value));
    const rolesFiltres = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);
    const datesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-date:checked')).map(cb => cb.value);

    document.querySelectorAll('.editable-cell').forEach(cell => {
        const cellMembre = parseInt(cell.dataset.membre);
        const cellDate = cell.dataset.date;
        const cellRole = cell.dataset.role;

        if (cellMembre === membreId &&
            membresFiltres.includes(cellMembre) &&
            rolesFiltres.includes(cellRole) &&
            datesFiltrees.includes(cellDate)) {
            cell.classList.add('highlight-cell');
        }
    });

    // Scroll vers la première cellule surlignée
    const firstHighlighted = document.querySelector('.highlight-cell');
    if (firstHighlighted) {
        firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function surlignerRole(membreId, role) {
    // Retirer tous les surlignages
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });

    // Retirer active des pills
    document.querySelectorAll('.role-pill.active').forEach(pill => {
        pill.classList.remove('active');
    });

    // Si on clique sur le même rôle, désactiver
    if (roleActifSurligne && roleActifSurligne.membreId === membreId && roleActifSurligne.role === role) {
        roleActifSurligne = null;
        return;
    }

    // Activer le nouveau rôle
    roleActifSurligne = { membreId, role };

    // Surligner les cellules correspondantes selon les filtres
    const datesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-date:checked')).map(cb => cb.value);

    document.querySelectorAll('.editable-cell').forEach(cell => {
        const cellRole = cell.dataset.role;
        const cellMembre = parseInt(cell.dataset.membre);
        const cellDate = cell.dataset.date;

        if (cellRole === role && cellMembre === membreId && datesFiltrees.includes(cellDate)) {
            cell.classList.add('highlight-cell');
        }
    });

    // Activer la pill cliquée
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Scroll vers la première cellule surlignée
    const firstHighlighted = document.querySelector('.highlight-cell');
    if (firstHighlighted) {
        firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ===== STATISTIQUES AVANCÉES =====

function initialiserFiltresStats() {
    if (planning.assignments.length === 0) return;

    // Remplir filtre membres
    const containerMembres = document.getElementById('filterMembresContainer');
    containerMembres.innerHTML = '';
    planning.membresAssignables.forEach(membre => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 mb-2 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="cursor-pointer filter-membre" value="${membre.id}" checked>
            <span>${membre.nom} ${membre.prenom}</span>
        `;
        containerMembres.appendChild(label);
    });

    // Remplir filtre dates
    const containerDates = document.getElementById('filterDatesContainer');
    containerDates.innerHTML = '';
    planning.datesSelectionnees.forEach(dateStr => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 mb-2 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="cursor-pointer filter-date" value="${dateStr}" checked>
            <span>${getJourNom(new Date(dateStr).getDay())} ${dateStr}</span>
        `;
        containerDates.appendChild(label);
    });

    // Remplir filtre rôles
    const containerRoles = document.getElementById('filterRolesContainer');
    containerRoles.innerHTML = '';
    const allRoles = [...new Set(planning.assignments.map(ass => ass.role))].sort();

    allRoles.forEach(role => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 mb-2 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="cursor-pointer filter-role" value="${role}" checked>
            <span>${role}</span>
        `;
        containerRoles.appendChild(label);
    });
}

function toggleAllMembres() {
    const checked = document.getElementById('filterAllMembres').checked;
    document.querySelectorAll('.filter-membre').forEach(cb => {
        cb.checked = checked;
    });
}

function toggleAllDates() {
    const checked = document.getElementById('filterAllDates').checked;
    document.querySelectorAll('.filter-date').forEach(cb => {
        cb.checked = checked;
    });
}

function toggleAllRoles() {
    const checked = document.getElementById('filterAllRoles').checked;
    document.querySelectorAll('.filter-role').forEach(cb => {
        cb.checked = checked;
    });
}

function afficherStatsAvancees() {
    const container = document.getElementById('statistiquesContainer');

    if (planning.assignments.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-chart-line text-6xl mb-4 text-gray-300"></i>
                <p class="text-lg">Générez un planning pour voir les statistiques</p>
            </div>
        `;
        return;
    }

    // Récupérer les filtres
    const membresFiltres = Array.from(document.querySelectorAll('.filter-membre:checked')).map(cb => parseInt(cb.value));
    const datesFiltrees = Array.from(document.querySelectorAll('.filter-date:checked')).map(cb => cb.value);
    const rolesFiltres = Array.from(document.querySelectorAll('.filter-role:checked')).map(cb => cb.value);

    if (membresFiltres.length === 0 || datesFiltrees.length === 0 || rolesFiltres.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-exclamation-circle text-6xl mb-4 text-gray-300"></i>
                <p class="text-lg">Veuillez sélectionner au moins un filtre dans chaque catégorie</p>
            </div>
        `;
        return;
    }

    // Filtrer les assignments
    const assignmentsFiltres = planning.assignments.filter(ass =>
        membresFiltres.includes(ass.membre.id) &&
        datesFiltrees.includes(ass.date) &&
        rolesFiltres.includes(ass.role)
    );

    if (assignmentsFiltres.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-inbox text-6xl mb-4 text-gray-300"></i>
                <p class="text-lg">Aucune donnée correspondant aux filtres sélectionnés</p>
            </div>
        `;
        return;
    }

    // Calculer les statistiques
    const stats = {};

    assignmentsFiltres.forEach(ass => {
        if (!stats[ass.membre.id]) {
            stats[ass.membre.id] = {
                total: 0,
                parRole: {},
                parDate: {},
                parTypeJour: {},
                details: []
            };
        }

        stats[ass.membre.id].total++;
        stats[ass.membre.id].parRole[ass.role] = (stats[ass.membre.id].parRole[ass.role] || 0) + 1;
        stats[ass.membre.id].parDate[ass.date] = (stats[ass.membre.id].parDate[ass.date] || 0) + 1;
        stats[ass.membre.id].parTypeJour[ass.typeJour] = (stats[ass.membre.id].parTypeJour[ass.typeJour] || 0) + 1;
        stats[ass.membre.id].details.push(ass);
    });

    let html = '';

    // Vue d'ensemble
    const totalAssignations = assignmentsFiltres.length;
    const nbMembres = Object.keys(stats).length;
    const moyenne = nbMembres > 0 ? totalAssignations / nbMembres : 0;
    const maxAff = nbMembres > 0 ? Math.max(...Object.values(stats).map(s => s.total)) : 0;
    const minAff = nbMembres > 0 ? Math.min(...Object.values(stats).map(s => s.total)) : 0;

    html += `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${totalAssignations}</div>
                <div class="text-sm text-gray-600">Total assignations</div>
            </div>
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${moyenne.toFixed(1)}</div>
                <div class="text-sm text-gray-600">Moyenne par membre</div>
            </div>
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${maxAff}</div>
                <div class="text-sm text-gray-600">Maximum</div>
            </div>
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${minAff}</div>
                <div class="text-sm text-gray-600">Minimum</div>
            </div>
        </div>
    `;

    // Détails par membre
    const sortedMembres = Object.keys(stats).sort((a, b) => stats[b].total - stats[a].total);

    html += '<div class="grid grid-cols-1 gap-6">';
    sortedMembres.forEach(membreId => {
        const membre = planning.membresAssignables.find(m => m.id == membreId);
        if (!membre) return;
        
        html += genererCarteStatsAvancees(membre, stats[membreId]);
    });
    html += '</div>';

    container.innerHTML = html;
}

function genererCarteStatsAvancees(membre, stat) {
    let html = `
        <div class="stat-card border border-gray-200">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-2xl font-bold text-gray-900">${membre.nom} ${membre.prenom}</h3>
                <div class="text-4xl font-bold text-gray-900">${stat.total}</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    `;

    // Par rôle
    if (Object.keys(stat.parRole).length > 0) {
        html += `
            <div>
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-tasks mr-1"></i>Par rôle:
                </div>
                <div class="space-y-1">
        `;

        Object.entries(stat.parRole).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
            const percentage = (count / stat.total * 100).toFixed(0);
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">${role}</span>
                    <span class="text-sm font-bold text-gray-900">${count} (${percentage}%)</span>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Par date
    if (Object.keys(stat.parDate).length > 0) {
        html += `
            <div>
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-calendar mr-1"></i>Par date:
                </div>
                <div class="space-y-1">
        `;

        Object.entries(stat.parDate).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, count]) => {
            const dateObj = new Date(date);
            const jourNom = getJourNom(dateObj.getDay());
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">${jourNom} ${date}</span>
                    <span class="text-sm font-bold text-gray-900">${count}</span>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Par type de jour
    if (Object.keys(stat.parTypeJour).length > 0) {
        html += `
            <div>
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-calendar-day mr-1"></i>Par type jour:
                </div>
                <div class="space-y-1">
        `;

        Object.entries(stat.parTypeJour).sort((a, b) => b[1] - a[1]).forEach(([typeJour, count]) => {
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">${typeJour}</span>
                    <span class="text-sm font-bold text-gray-900">${count}</span>
                </div>
            `;
        });

        html += '</div></div>';
    }

    html += '</div>';

    // Détails chronologiques
    html += `
        <div class="mt-4 border-t border-gray-200 pt-4">
            <div class="text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-list mr-1"></i>Détail des assignations:
            </div>
            <div class="max-h-40 overflow-y-auto">
                <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-gray-50">
                        <tr class="text-left">
                            <th class="py-1 px-2">Date</th>
                            <th class="py-1 px-2">Type Jour</th>
                            <th class="py-1 px-2">Rôle</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    stat.details.sort((a, b) => a.date.localeCompare(b.date)).forEach(detail => {
        const dateObj = new Date(detail.date);
        const jourNom = getJourNom(dateObj.getDay());
        html += `
            <tr class="border-t border-gray-100">
                <td class="py-1 px-2">${jourNom} ${detail.date}</td>
                <td class="py-1 px-2">${detail.typeJour}</td>
                <td class="py-1 px-2">${detail.role}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    html += '</div>';

    return html;
}

// Fonction appelée lors de modification de cellule
function rafraichirStats() {
    if (planning.assignments.length > 0) {
        afficherStatsAvancees();
    }
}

// ===== EXPORT EXCEL =====

function exporterExcel() {
    if (planning.assignments.length === 0) {
        afficherMessage('Veuillez d\'abord générer un planning', 'error');
        return;
    }

    // Préparer les données
    const data = [];

    // Header: Jour | Rôle | Date1 | Date2 | ...
    const header = ['Jour', 'Rôle'];
    planning.datesSelectionnees.forEach(dateStr => {
        const date = new Date(dateStr);
        const jourNom = getJourNom(date.getDay());
        header.push(`${jourNom} ${dateStr}`);
    });
    data.push(header);

    // Regrouper les assignments par type de jour et rôle
    const assignmentsGrouper = {};
    planning.assignments.forEach(ass => {
        const key = `${ass.typeJour}_${ass.role}`;
        if (!assignmentsGrouper[key]) {
            assignmentsGrouper[key] = {};
        }
        assignmentsGrouper[key][ass.date] = ass.membre;
    });

    // Ajouter les lignes
    Object.entries(planning.rolesParTypeJour).forEach(([typeJour, roles]) => {
        roles.forEach(role => {
            const key = `${typeJour}_${role}`;
            const row = [typeJour, role];
            
            planning.datesSelectionnees.forEach(dateStr => {
                const assignment = assignmentsGrouper[key] && assignmentsGrouper[key][dateStr];
                if (assignment) {
                    row.push(`${assignment.nom} ${assignment.prenom}`);
                } else {
                    row.push('');
                }
            });
            
            data.push(row);
        });
    });

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Largeur des colonnes
    const colWidths = [
        { wch: 12 }, // Jour
        { wch: 20 }  // Rôle
    ];
    planning.datesSelectionnees.forEach(() => {
        colWidths.push({ wch: 20 }); // Dates
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Planning');

    // Télécharger
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `planning_roles_${date}.xlsx`);

    afficherMessage('Planning exporté avec succès !', 'success');
}

// ===== SAUVEGARDE LOCALE =====

function sauvegarderDonnees() {
    localStorage.setItem('planningData', JSON.stringify(planning));
}

function chargerDonnees() {
    const saved = localStorage.getItem('planningData');
    if (saved) {
        const data = JSON.parse(saved);
        planning = {
            ...planning, // valeurs par défaut
            ...data      // données sauvegardées
        };
    }
}

// ===== AUTOCOMPLETE POUR CELLULES ÉDITABLES =====

let dropdownActif = null;

function ouvrirAutocomplete(cell, dateStr, typeJour, role) {
    // Fermer le dropdown existant
    if (dropdownActif) {
        dropdownActif.remove();
        dropdownActif = null;
    }

    // Récupérer les membres disponibles pour cette date
    const membresDisponibles = planning.membresAssignables.filter(membre =>
        membre.disponibilites.includes(dateStr)
    );

    if (membresDisponibles.length === 0) {
        afficherMessage(`Aucun membre disponible pour ${dateStr}`, 'error');
        return;
    }

    const membreActuelId = cell.dataset.membre ? parseInt(cell.dataset.membre) : null;

    // Créer le dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';

    // Position du dropdown
    const rect = cell.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;

    // Option pour vider la cellule
    const emptyOption = document.createElement('div');
    emptyOption.className = 'autocomplete-item';
    emptyOption.innerHTML = '<span class="empty-cell">Vider</span>';
    emptyOption.onclick = () => {
        modifierAssignment(dateStr, typeJour, role, null, cell);
        dropdown.remove();
        dropdownActif = null;
    };
    dropdown.appendChild(emptyOption);

    // Ajouter un séparateur
    if (membresDisponibles.length > 0) {
        const separator = document.createElement('div');
        separator.style.borderTop = '1px solid #e5e7eb';
        separator.style.margin = '0.25rem 0';
        dropdown.appendChild(separator);
    }

    // Options pour les membres
    membresDisponibles.forEach(membre => {
        const option = document.createElement('div');
        option.className = 'autocomplete-item';

        if (membre.id == membreActuelId) {
            option.classList.add('selected');
        }

        option.textContent = `${membre.nom} ${membre.prenom}`;

        option.onclick = () => {
            modifierAssignment(dateStr, typeJour, role, membre, cell);
            dropdown.remove();
            dropdownActif = null;
        };
        dropdown.appendChild(option);
    });

    // Message si aucun membre éligible
    if (membresDisponibles.length === 0) {
        const noOption = document.createElement('div');
        noOption.className = 'autocomplete-item';
        noOption.style.color = '#9ca3af';
        noOption.style.fontStyle = 'italic';
        noOption.textContent = 'Aucun membre disponible';
        dropdown.appendChild(noOption);
    }

    document.body.appendChild(dropdown);
    dropdownActif = dropdown;
}

function modifierAssignment(dateStr, typeJour, role, nouveauMembre, cell) {
    // Trouver et supprimer l'ancienne assignment
    const index = planning.assignments.findIndex(ass =>
        ass.date === dateStr &&
        ass.role === role
    );

    if (index !== -1) {
        planning.assignments.splice(index, 1);
    }

    // Ajouter la nouvelle assignment si un membre est sélectionné
    if (nouveauMembre) {
        planning.assignments.push({
            date: dateStr,
            typeJour: typeJour,
            role: role,
            membre: nouveauMembre,
            mode: 'manuel' // Marqué comme assigné manuellement
        });
    }

    // Mettre à jour la cellule
    cell.dataset.membre = nouveauMembre ? nouveauMembre.id : '';
    if (nouveauMembre) {
        cell.innerHTML = `${nouveauMembre.nom} ${nouveauMembre.prenom}`;
        cell.classList.remove('empty-cell');
    } else {
        cell.innerHTML = '<span class="empty-cell">Vide</span>';
        cell.classList.add('empty-cell');
    }

    // Rafraîchir les statistiques et l'assistant
    rafraichirStats();
    mettreAJourAssistant();
}

// Fermer le dropdown si on clique ailleurs
document.addEventListener('click', (e) => {
    if (dropdownActif && !e.target.closest('.autocomplete-dropdown') && !e.target.closest('.editable-cell')) {
        dropdownActif.remove();
        dropdownActif = null;
    }
});

// ===== RÉINITIALISATION DU PLANNING =====

function reinitialiserPlanning() {
    if (!confirm('Voulez-vous vraiment réinitialiser le planning ? Toutes les affectations seront supprimées.')) {
        return;
    }

    planning.assignments = [];

    // Vider le tableau
    const table = document.getElementById('tableauPlanning');
    table.innerHTML = `
        <thead class="desktop-view">
            <tr>
                <th>Jour</th>
                <th>Rôle</th>
            </tr>
        </thead>
        <tbody>
            <tr class="desktop-view">
                <td class="text-center text-gray-500 py-12" colspan="100">
                    <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING" ou utilisez la génération automatique.</p>
                </td>
            </tr>
            <tr class="mobile-view">
                <td class="text-center text-gray-500 py-12">
                    <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING" ou utilisez la génération automatique.</p>
                </td>
            </tr>
        </tbody>
    `;

    // Cacher l'assistant
    document.getElementById('assistantPanel').style.display = 'none';

    afficherMessage('Planning réinitialisé', 'success');
}

// ===== IMPORT/EXPORT JSON =====

function exporterPlanningJSON() {
    if (planning.assignments.length === 0) {
        afficherMessage('Aucun planning à exporter', 'error');
        return;
    }

    const data = {
        planning: planning,
        dateExport: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const date = new Date().toISOString().split('T')[0];
    const exportFileDefaultName = `planning_complet_${date}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    afficherMessage('Planning exporté avec succès', 'success');
}

function importerPlanningJSON() {
    document.getElementById('importPlanningFile').click();
}

function handlePlanningImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        afficherMessage('Veuillez sélectionner un fichier JSON valide', 'error');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // Valider la structure
            if (!data.planning) {
                afficherMessage('Structure du fichier invalide', 'error');
                return;
            }

            // Importer le planning
            planning = data.planning;

            // Afficher
            afficherListes();
            afficherTableauPlanning();
            mettreAJourAssistant();

            afficherMessage('Planning importé avec succès', 'success');
        } catch (error) {
            console.error('Erreur import:', error);
            afficherMessage(`Erreur lors de l'import: ${error.message}`, 'error');
        }
        event.target.value = '';
    };

    reader.onerror = function() {
        afficherMessage('Erreur lors de la lecture du fichier', 'error');
        event.target.value = '';
    };

    reader.readAsText(file);
}