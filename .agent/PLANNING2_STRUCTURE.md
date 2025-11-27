# 📋 STRUCTURE ET FONCTIONNEMENT DU PLANNING2

## 📁 ARCHITECTURE GÉNÉRALE

Le système Planning2 est une application complète de gestion de plannings d'affectations avec une architecture frontend React + backend Spring Boot.

---

## 🔧 BACKEND (Java/Spring Boot)

### 📂 Structure des dossiers
```
back/src/main/java/com/example/demo/
├── controller/
│   └── PlanningRestController.java
├── model/
│   ├── Planning.java
│   ├── PlanningSession.java
│   ├── Availability.java
│   └── Membre.java
├── dto/
│   └── PlanningSessionDTO.java
├── service/
│   └── PlanningSessionService.java
└── repository/
    ├── PlanningRepository.java
    ├── PlanningSessionRepository.java
    └── AvailabilityRepository.java
```

---

### 🗄️ MODÈLES DE DONNÉES (Models)

#### 1. **PlanningSession** (Table: `planning_sessions`)
**Rôle**: Représente une session de planning (un ensemble de dates et de configurations)

**Champs principaux**:
- `id` (Long) - Identifiant unique
- `nom` (String) - Nom de la session
- `description` (String) - Description
- `createdAt` (LocalDateTime) - Date de création
- `selectedDates` (List<String>) - Liste des dates sélectionnées (format YYYY-MM-DD)
- `customRoles` (String) - Rôles personnalisés en JSON
- `selectedPeople` (List<Membre>) - Liste des membres participants (ManyToMany)
- `plannings` (List<Planning>) - Plannings associés (OneToMany)

**Relations**:
- OneToMany avec `Planning` (mappedBy = "session")
- ManyToMany avec `Membre` (via table `planning_session_membres`)
- ElementCollection pour `selectedDates` (table `planning_session_dates`)

---

#### 2. **Planning** (Table: `planning`)
**Rôle**: Représente une affectation individuelle (qui fait quoi, quand)

**Champs principaux**:
- `id` (Long) - Identifiant unique
- `date` (String) - Date spécifique (YYYY-MM-DD)
- `roleName` (String) - Nom du rôle
- `membreNom` (String) - Nom du membre affecté
- `numeroSemaine` (Integer) - Numéro de semaine (optionnel)
- `jour` (Jour) - Référence au jour (ManyToOne, optionnel)
- `role` (Role) - Référence au rôle (ManyToOne, optionnel)
- `membre` (Membre) - Référence au membre (ManyToOne, optionnel)
- `session` (PlanningSession) - Référence à la session (ManyToOne, obligatoire)

**Relations**:
- ManyToOne avec `PlanningSession`
- ManyToOne avec `Jour`, `Role`, `Membre` (tous optionnels)

---

#### 3. **Availability** (Table: `availability`)
**Rôle**: Gère les disponibilités des membres pour chaque date

**Champs principaux**:
- `id` (Long)
- `membre` (Membre) - ManyToOne
- `planningSession` (PlanningSession) - ManyToOne
- `date` (String) - Date
- `disponible` (boolean) - Disponibilité

---

### 🎯 CONTROLLER (PlanningRestController.java)

**Base URL**: `/api/planning`

#### Endpoints Planning Sessions:

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/sessions` | Récupère toutes les sessions |
| GET | `/sessions/{id}` | Récupère une session par ID |
| POST | `/sessions` | Crée une nouvelle session |
| PUT | `/sessions/{id}` | Met à jour une session |
| DELETE | `/sessions/{id}` | Supprime une session (cascade) |

#### Endpoints Availability:

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/sessions/{sessionId}/availability` | Récupère les disponibilités d'une session |
| GET | `/sessions/{sessionId}/availability/membre/{membreId}` | Disponibilités par membre |
| POST | `/sessions/{sessionId}/availability` | Crée une disponibilité |
| PUT | `/sessions/{sessionId}/availability/{id}` | Met à jour une disponibilité |
| DELETE | `/sessions/{sessionId}/availability/{id}` | Supprime une disponibilité |

#### Endpoints Planning:

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Tous les plannings |
| GET | `/{id}` | Planning par ID |
| GET | `/session/{sessionId}` | Plannings par session |
| GET | `/semaine/{numeroSemaine}` | Plannings par semaine |
| GET | `/jour/{jourId}` | Plannings par jour |
| GET | `/role/{roleId}` | Plannings par rôle |
| GET | `/membre/{membreId}` | Plannings par membre |
| POST | `/` | Crée un planning |
| PUT | `/{id}` | Met à jour un planning |
| DELETE | `/{id}` | Supprime un planning |
| DELETE | `/reset` | Réinitialise tout |

---

### 🔄 SERVICE (PlanningSessionService.java)

**Rôle**: Conversion entre DTO et Entité

**Méthodes principales**:
- `fromDto(PlanningSessionDTO dto)` → `PlanningSession`
  - Convertit les personCodes en objets Membre via MembreRepository
- `toDto(PlanningSession entity)` → `PlanningSessionDTO`
  - Convertit les objets Membre en personCodes

---

### 📦 DTO (Data Transfer Object)

**PlanningSessionDTO**: Version allégée de PlanningSession pour les échanges API

**Différence clé avec l'entité**:
- `selectedPeople` est une `List<String>` (personCodes) au lieu de `List<Membre>`
- Évite les problèmes de sérialisation JSON avec les relations Hibernate

---

## 💻 FRONTEND (React)

### 📂 Structure des dossiers
```
front/src/features/planning2/
├── Planning2.jsx              # Composant principal
├── planning2.css              # Styles
├── components/
│   ├── PlanningStateProvider.jsx   # Context Provider (état global)
│   ├── PlanningGlobalTab.jsx       # Onglet "Global"
│   ├── PlanningConfigTab.jsx       # Onglet "Config"
│   ├── PlanningScheduleTab.jsx     # Onglet "Planning"
│   └── StatsTab.jsx                # Onglet "Stats"
└── services/
    └── planningService.js          # API calls
```

---

### 🧩 COMPOSANTS PRINCIPAUX

#### 1. **Planning2.jsx** (Composant racine)
**Rôle**: Layout principal, navigation entre onglets

**Structure**:
- Header avec sélection de planning actif
- Bouton "Créer" nouveau planning
- Navigation (tabs): Global | Config | Planning | Stats
- Boutons d'action: Supprimer, Sauvegarder, Réinitialiser
- Zone d'affichage des onglets

**State management**:
- Utilise `PlanningStateProvider` pour accéder au contexte
- Gère `activeTab` (onglet actif)
- Gère `toast` (notifications)

---

#### 2. **PlanningStateProvider.jsx** (Context Provider)
**Rôle**: État global centralisé pour toute l'application Planning2

**State principal (`store`)**:
```javascript
{
  plans: [],              // Liste des sessions de planning
  sessions: [],           // Alias pour compatibilité
  currentPlanId: null,    // ID du plan actif
  global: {
    days: [],             // Liste des jours (Jour)
    roles: [],            // Liste des rôles (Role)
    people: [],           // Liste des membres (Membre)
    rolesConfig: {},      // {dayType: [roles]} ex: {"0": ["Accueil", "Chant"]}
    dayMapping: {}        // {ordreAffichage: jourId} ex: {"0": 1}
  },
  loading: false,
  error: null
}
```

**Fonctions exposées**:

*Gestion des plans*:
- `loadPlans()` - Charge toutes les sessions
- `switchPlan(planId)` - Change le plan actif
- `addPlan(plan)` - Ajoute un nouveau plan
- `deletePlan(planId)` - Supprime un plan

*Gestion globale*:
- `loadGlobalData()` - Charge roles, jours, membres
- `addRole(dayType, roleName)` - Ajoute un rôle global
- `removeGlobalRole(dayType, roleName)` - Supprime un rôle global

*Configuration du plan*:
- `updatePlanTitle(newTitle)` - Change le titre
- `togglePlanPerson(personId)` - Sélectionne/désélectionne un participant
- `toggleDispo(personId, date, isAvailable)` - Définit la disponibilité
- `togglePlanRole(dayType, role, enable)` - Active/désactive un rôle
- `addCustomPlanRole(dayType, roleName)` - Ajoute un rôle personnalisé
- `removeCustomPlanRole(dayType, roleName)` - Supprime un rôle personnalisé

*Planification*:
- `setHighlight({ person, role })` - Surligne dans le tableau

---

#### 3. **PlanningGlobalTab.jsx** (Onglet Global)
**Rôle**: Configuration globale (rôles et membres)

**Fonctionnalités**:

**Section 1: Gestion des Rôles Globaux**
- Sélection du jour (Dimanche, Sabbat, Vendredi, Mercredi)
- Ajout de rôles pour chaque type de jour
- Suppression de rôles
- Sauvegarde automatique vers backend (`POST /api/roles`)

**Section 2: Base de Membres**
- Filtres multiples:
  - Recherche par nom/prénom
  - Sexe (homme/femme/all)
  - Baptisé (oui/non/all)
  - Catégorie
  - Source (acms/manuel/all)
- Tableau avec sélection multiple
- Sélection/Désélection globale
- Synchronisation avec `store.global.people`

**Interactions Backend**:
- `membreApi.getAll(filters)` - Récupère les membres filtrés
- `POST /api/roles` - Ajoute un rôle
- `DELETE /api/roles/name/{role}` - Supprime un rôle

---

#### 4. **PlanningConfigTab.jsx** (Onglet Config)
**Rôle**: Configuration spécifique d'un planning

**Fonctionnalités**:

**Section 1: Informations de base**
- Titre du planning (éditable)
- Sélection des dates (Flatpickr multi-dates)
  - Sauvegarde auto vers backend après modification

**Section 2: Participants & Disponibilités**
- Tableau matriciel:
  - Lignes: Membres sélectionnés
  - Colonnes: Dates sélectionnées
  - Cellules: Checkboxes de disponibilité (vert/gris)
- Affiche seulement les membres dans `currentPlan.selectedPeople`

**Section 3: Rôles Personnalisés**
- Sélection du type de jour
- Affiche les rôles globaux (avec possibilité de désactivation)
- Permet d'ajouter des rôles spécifiques au planning
- Structure `customRoles`:
```javascript
{
  "0": {  // dayType (0 = Dimanche)
    "add": ["Rôle Custom 1"],      // Rôles ajoutés
    "remove": ["Rôle Global A"]    // Rôles désactivés
  }
}
```

**Interactions Backend**:
- `PUT /api/planning/sessions/{id}` - Sauvegarde les modifications

---

#### 5. **PlanningScheduleTab.jsx** (Onglet Planning)
**Rôle**: Génération et visualisation du planning final

**Fonctionnalités**:

**Section 1: Tableau de Planning**
- Structure par semaines et rôles
- Colonnes: Jour | Rôle | Semaine 1 | Semaine 2 | ...
- Affiche les affectations: `assignments["{date}_{role}"] = personId`
- Surlignage dynamique selon `highlight`

**Section 2: Générateur Automatique**
- Algorithme de génération:
  1. Parcourt chaque date et rôle
  2. Filtre les candidats disponibles (`availability`)
  3. Exclut ceux déjà affectés le même jour
  4. Sélectionne celui avec le moins d'affectations totales
  5. En cas d'égalité: random
- Sauvegarde dans `store.plans[currentPlanId].assignments`
- Envoie chaque affectation au backend: `POST /api/planning`

**Section 3: Assistant Matriciel**
- Tableau temps réel:
  - Lignes: Membres triés par nom
  - Colonnes: Rôles par type de jour
  - Cellules: Nombre d'affectations par rôle
  - Dernière colonne: Total par membre
- Clic sur nom → surligne toutes les affectations du membre
- Clic sur chiffre → surligne le couple (membre, rôle)

**Section 4: Export Excel**
- Utilise `xlsx` library
- Génère un fichier avec structure identique au tableau de planning
- Nom du fichier = nom du planning

**Interactions Backend**:
- `POST /api/planning` - Crée chaque affectation

---

#### 6. **StatsTab.jsx** (Onglet Stats)
**Rôle**: Statistiques basiques (à développer)

---

### 🌐 SERVICE API (planningService.js)

**Méthodes disponibles**:

```javascript
// Sessions
getAllSessions()
getSessionById(id)
createSession(sessionData)
updateSession(id, sessionData)
deleteSession(id)

// Planning par session
getPlanningBySession(sessionId)
```

**Configuration**:
- Base URL: `http://localhost:8082/api/planning`
- Méthode HTTP: fetch API
- Headers: `Content-Type: application/json`

---

## 🔄 FLUX DE DONNÉES

### 1. **Chargement initial**
```
1. User ouvre Planning2
2. PlanningStateProvider.loadGlobalData()
   → GET /api/roles
   → GET /api/jours
   → membreApi.getAll()
   → Remplit store.global
3. PlanningStateProvider.loadPlans()
   → GET /api/planning/sessions
   → Remplit store.plans
4. Auto-sélection du premier plan
   → switchPlan(plans[0].id)
```

### 2. **Création d'un nouveau planning**
```
1. User clique "Créer" dans header
2. Prompt pour le nom
3. Calcul de 4 dimanches par défaut
4. POST /api/planning/sessions
   {
     nom: "...",
     description: "...",
     selectedDates: ["2025-11-30", ...],
     customRoles: "{}",
     selectedPeople: [...]
   }
5. Response ajouté à store.plans
6. switchPlan(newPlan.id)
```

### 3. **Configuration du planning**
```
1. User va dans onglet "Config"
2. PlanningConfigTab affiche currentPlan
3. User modifie dates (Flatpickr)
   → onChange callback
   → setStore() met à jour store.plans
   → PUT /api/planning/sessions/{id}
4. User coche/décoche disponibilités
   → toggleDispo(personId, date, isAvailable)
   → Met à jour currentPlan.availability
   → (Pas de sauvegarde auto backend pour l'instant)
5. User ajoute rôle personnalisé
   → addCustomPlanRole(dayType, roleName)
   → Met à jour currentPlan.customRoles
```

### 4. **Génération du planning**
```
1. User va dans onglet "Planning"
2. User clique "Générer"
3. generateSchedule() exécute algorithme
4. Pour chaque affectation générée:
   → POST /api/planning {
       session: {id},
       date,
       roleName,
       membreNom
     }
5. Met à jour store.plans[currentPlanId].assignments
6. Tableau se met à jour automatiquement
```

### 5. **Export Excel**
```
1. User clique "Excel"
2. exportToExcel()
3. Construit tableau 2D à partir de:
   - weeks = getWeeksStruct(dates)
   - roles = getPlanRoles(plan, dates)
   - assignments = currentPlan.assignments
4. XLSX.utils.aoa_to_sheet(data)
5. XLSX.writeFile(wb, filename)
6. Téléchargement automatique
```

---

## 🔑 CONCEPTS CLÉS

### **dayType / ordreAffichage**
- Représente le jour de la semaine (0-6)
- 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi/Sabbat
- Utilisé comme clé dans `rolesConfig`
- Correspond à `jour.ordreAffichage` en base

### **selectedPeople**
- Session: Liste d'IDs de membres participants
- Utilisé pour filtrer qui peut être affecté
- Synchronisé avec `store.global.people`

### **availability**
- Structure: `{"personId_date": boolean}`
- `false` = INDISPONIBLE
- `undefined` ou `true` = DISPONIBLE
- Utilisé par l'algorithme de génération

### **assignments**
- Structure: `{"date_roleName": personId}`
- Ex: `{"2025-11-30_Accueil": "12345"}`
- Représente qui fait quoi quand

### **customRoles**
- Structure par dayType:
```javascript
{
  "0": {
    "add": ["Rôle Custom"],      // Ajoutés spécifiquement
    "remove": ["Rôle Global"]    // Désactivés temporairement
  }
}
```
- Stocké en JSON dans la base de données

---

## 🎨 INTERFACE UTILISATEUR

### Navigation
```
Header
├── Logo + Nom du planning actif (dropdown)
├── Bouton "Créer"
├── Tabs: [Global] [Config] [Planning] [Stats]
└── Actions: [🗑️] [💾] [💣]

Tabs
├── Global: Configuration globale (rôles + membres)
├── Config: Configuration du planning actif
├── Planning: Génération + visualisation
└── Stats: Statistiques
```

### Couleurs thématiques
- Primary: Indigo/Blue
- Success: Emerald/Green
- Error: Red
- Info: Blue
- Warning: Yellow

---

## ⚠️ POINTS D'ATTENTION

### Backend
1. **Cascade Delete**: Supprimer une session supprime tous les plannings associés
2. **DTO Conversion**: Les membres sont stockés via personCode, pas ID
3. **Lazy Loading**: Les relations sont en LAZY, attention aux N+1 queries

### Frontend
1. **State Management**: Tout passe par PlanningStateProvider
2. **Auto-save**: ✅ **TOUTES les modifications sont maintenant sauvegardées automatiquement** :
   - **Dates** : Sauvegardées via Flatpickr onChange
   - **CustomRoles** : Sauvegardés via `savePlanToBackend()` à chaque modification
   - **SelectedPeople** : Sauvegardés automatiquement à chaque changement
   - **Availability** : Sauvegardés automatiquement via `savePlanToBackend()`
   - **Titre du planning** : Sauvegardé automatiquement
3. **currentPlan**: Calculé dynamiquement via useMemo
4. **customRoles**: Peut être String (JSON) ou Object selon le contexte
5. **Flatpickr**: Configuré avec `closeOnSelect: false` pour permettre la sélection multiple sans fermeture automatique

### Synchronisation
- ✅ Les modifications frontend sont automatiquement sauvegardées vers le backend
- ✅ Les dates, customRoles, selectedPeople, et availability sont persistés automatiquement
- ✅ L'algorithme de génération sauvegarde chaque affectation individuellement
- ⚠️ **Note importante** : `availability` et `assignments` ne sont pas encore stockés dans PlanningSession en base de données
  - Actuellement sauvegardés dans le state frontend uniquement
  - Pour une persistance complète, il faudra :
    1. Utiliser les endpoints `/api/planning/sessions/{sessionId}/availability` pour les disponibilités
    2. Créer des entités `Planning` via `/api/planning` pour les assignments

---

## 🚀 AMÉLIORATIONS POSSIBLES

1. **Sauvegarde automatique** des disponibilités vers backend
2. **Undo/Redo** pour les modifications
3. **Drag & Drop** pour réaffecter manuellement
4. **Statistiques avancées** dans StatsTab
5. **Notifications** en temps réel (WebSocket)
6. **Versioning** des plannings
7. **Templates** de plannings réutilisables
8. **Contraintes avancées** (ex: pas 2x le même rôle dans le mois)
9. **Multi-utilisateurs** avec gestion des conflits

---

## 📝 RÉSUMÉ TECHNIQUE

**Frontend**:
- React 18 avec Hooks
- Context API pour state management
- Flatpickr pour sélection de dates
- XLSX pour export Excel
- Axios pour requêtes HTTP

**Backend**:
- Spring Boot 3
- JPA/Hibernate pour ORM
- PostgreSQL/MySQL (base de données)
- DTO pattern pour séparation concerns
- REST API

**Communication**:
- REST API JSON
- Base URL: `http://localhost:8082`
- CORS activé pour `http://localhost:5173`

---

*Document créé le 2025-11-27*
*Version: 1.0*
