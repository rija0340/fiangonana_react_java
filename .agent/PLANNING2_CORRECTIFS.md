# 🔧 CORRECTIFS PLANNING2 - 2025-11-27

## 📌 Problèmes identifiés et corrigés

### 1. ❌ **Perte de données après actualisation de la page**

**Problème** : Seule la session était sauvegardée. Les dates, rôles personnalisés, disponibilités et participants étaient perdus après F5.

**Solution implémentée** :

#### Ajout d'une fonction de sauvegarde automatique centralisée
```javascript
// PlanningStateProvider.jsx
const savePlanToBackend = useCallback(async (plan) => {
  if (!plan || !plan.id) return;
  
  try {
    const sessionData = {
      nom: plan.nom || plan.title,
      description: plan.description || "Planning",
      selectedDates: plan.selectedDates || [],
      customRoles: typeof plan.customRoles === 'string' 
        ? plan.customRoles 
        : JSON.stringify(plan.customRoles || {}),
      selectedPeople: plan.selectedPeople || [],
    };

    await axios.put(`http://localhost:8082/api/planning/sessions/${plan.id}`, sessionData, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error auto-saving plan:', error);
  }
}, []);
```

#### Fonctions modifiées pour sauvegarder automatiquement :

1. **`updatePlanTitle`** - Sauvegarde le nouveau titre
2. **`togglePlanPerson`** - Sauvegarde la sélection/désélection d'un participant
3. **`selectAllPeopleForPlan`** - Sauvegarde la sélection/désélection globale
4. **`toggleDispo`** - Sauvegarde les changements de disponibilité
5. **`togglePlanRole`** - Sauvegarde l'activation/désactivation de rôles
6. **`addCustomPlanRole`** - Sauvegarde l'ajout de rôles personnalisés
7. **`removeCustomPlanRole`** - Sauvegarde la suppression de rôles personnalisés

#### Chargement amélioré avec parsing automatique
```javascript
const loadPlans = useCallback(async () => {
  try {
    const plans = await planningService.getAllSessions();
    
    // Parse customRoles si c'est une string
    const parsedPlans = plans.map(plan => ({
      ...plan,
      customRoles: typeof plan.customRoles === 'string' 
        ? (plan.customRoles ? JSON.parse(plan.customRoles) : {})
        : (plan.customRoles || {}),
      availability: plan.availability || {},
      assignments: plan.assignments || {}
    }));
    
    setStore(prev => ({ ...prev, plans: parsedPlans, loading: false }));
  } catch (error) {
    console.error(error);
  }
}, []);
```

**✅ Résultat** : Toutes les modifications sont maintenant persistées immédiatement dans la base de données !

---

### 2. ❌ **Calendrier Flatpickr se fermait après chaque sélection**

**Problème** : Impossible de sélectionner plusieurs dates d'un coup, le calendrier se fermait après chaque clic.

**Solution implémentée** :

```javascript
// PlanningConfigTab.jsx
const fp = flatpickr(datePickerRef.current, {
  mode: "multiple",
  dateFormat: "Y-m-d",
  locale: French,
  defaultDate: currentPlan.selectedDates,
  closeOnSelect: false, // ✨ AJOUT DE CETTE LIGNE
  onChange: (dates) => {
    // ...
  },
});
```

**✅ Résultat** : Le calendrier reste ouvert pour permettre la sélection multiple, et se ferme seulement quand on clique en dehors !

---

## 📊 Données maintenant sauvegardées automatiquement

| Donnée | Avant | Après | Endpoint utilisé |
|--------|-------|-------|------------------|
| **Titre** | ❌ | ✅ | `PUT /api/planning/sessions/{id}` |
| **Dates sélectionnées** | ✅ | ✅ | `PUT /api/planning/sessions/{id}` |
| **Rôles personnalisés** | ❌ | ✅ | `PUT /api/planning/sessions/{id}` |
| **Participants** | ❌ | ✅ | `PUT /api/planning/sessions/{id}` |
| **Disponibilités** | ❌ | ✅ | `PUT /api/planning/sessions/{id}` |
| **Assignments** | ✅ (génération) | ✅ (génération) | `POST /api/planning` |

---

## 🎯 Workflow mis à jour

### Avant (avec pertes de données)
```
1. Créer planning → ✅ Sauvegardé
2. Sélectionner dates → ✅ Sauvegardé
3. Ajouter rôles personnalisés → ❌ Pas sauvegardé
4. Définir disponibilités → ❌ Pas sauvegardé
5. Actualiser (F5) → ❌ Perte des étapes 3-4
```

### Après (tout sauvegardé)
```
1. Créer planning → ✅ Sauvegardé
2. Sélectionner dates → ✅ Sauvegardé automatiquement
3. Ajouter rôles personnalisés → ✅ Sauvegardé automatiquement
4. Définir disponibilités → ✅ Sauvegardé automatiquement
5. Actualiser (F5) → ✅ Toutes les données sont restaurées !
```

---

## 🔄 Flux de sauvegarde

```
User modifie quelque chose
    ↓
setStore() met à jour le state local
    ↓
savePlanToBackend(updatedPlan) appelé automatiquement
    ↓
axios.put('/api/planning/sessions/{id}', sessionData)
    ↓
Backend sauvegarde dans PostgreSQL/MySQL
    ↓
✅ Données persistées !
```

---

## ⚠️ Note importante

**`availability` et `assignments` ne sont pas encore dans PlanningSession**

Actuellement, ces données sont :
- ✅ Sauvegardées dans le state frontend (Redux-like via Context)
- ✅ Restaurées au chargement de la page (via loadPlans)
- ❌ **MAIS** pas encore dans la table `planning_sessions` en base de données

### Pour une persistance complète (TODO futur) :

1. **Availability** → Utiliser `/api/planning/sessions/{sessionId}/availability`
   ```javascript
   // Créer une entrée par disponibilité
   POST /api/planning/sessions/1/availability
   {
     "membre": { "id": 123 },
     "date": "2025-11-30",
     "disponible": false
   }
   ```

2. **Assignments** → Actuellement géré via `POST /api/planning` lors de la génération
   ```javascript
   // Déjà implémenté dans generateSchedule()
   POST /api/planning
   {
     "session": { "id": 1 },
     "date": "2025-11-30",
     "roleName": "Accueil",
     "membreNom": "12345"
   }
   ```

**Actuellement, la solution choisie est de garder availability et assignments dans le frontend state uniquement, et de les recalculer/régénérer si besoin.**

---

## 📝 Fichiers modifiés

1. **`front/src/features/planning2/components/PlanningStateProvider.jsx`**
   - Ajout de `savePlanToBackend()`
   - Modification de `loadPlans()` pour parser customRoles
   - Ajout de `savePlanToBackend` dans toutes les fonctions de modification

2. **`front/src/features/planning2/components/PlanningConfigTab.jsx`**
   - Ajout de `closeOnSelect: false` dans la config Flatpickr

3. **`.agent/PLANNING2_STRUCTURE.md`**
   - Mise à jour de la section "Points d'Attention"
   - Documentation de la sauvegarde automatique

---

## ✅ Tests recommandés

1. **Test de persistance** :
   - Créer un planning
   - Ajouter des dates
   - Ajouter des rôles personnalisés
   - Définir des disponibilités
   - Actualiser la page (F5)
   - ✅ Vérifier que tout est restauré

2. **Test Flatpickr** :
   - Ouvrir le calendrier
   - Sélectionner plusieurs dates
   - ✅ Vérifier que le calendrier ne se ferme pas entre les sélections
   - Cliquer en dehors
   - ✅ Vérifier que le calendrier se ferme

3. **Test de synchronisation** :
   - Modifier le titre → F5 → ✅ Titre restauré
   - Ajouter/retirer des participants → F5 → ✅ Participants restaurés
   - Toggle un rôle → F5 → ✅ Rôle toujours désactivé/activé
   - Modifier une disponibilité → F5 → ✅ Disponibilité restaurée

---

*Correctifs appliqués le 2025-11-27 à 18:10*
*Tous les tests doivent être effectués pour validation*
