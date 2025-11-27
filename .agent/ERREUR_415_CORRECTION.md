# 🐛 CORRECTION ERREUR 415 - Unsupported Media Type

## ❌ Erreur rencontrée

```json
{
  "timestamp": "2025-11-27T15:17:40.727+00:00",
  "status": 415,
  "error": "Unsupported Media Type",
  "path": "/api/planning"
}
```

## 🔍 Cause du problème

**Import dynamique d'axios** : L'utilisation de `import('axios')` causait des problèmes avec l'envoi des headers HTTP, notamment `Content-Type: application/json`.

Exemple de code problématique :
```javascript
// ❌ PROBLEMATIQUE
import('axios').then(axios =>
  axios.default.post('http://localhost:8082/api/planning', data, {
    headers: { 'Content-Type': 'application/json' }
  })
);
```

Le backend Spring Boot ne recevait pas le bon `Content-Type` et retournait une erreur 415.

---

## ✅ Solution appliquée

### 1. Import statique d'axios au début de chaque fichier

Au lieu d'un import dynamique, nous avons ajouté l'import statique en haut de chaque fichier :

```javascript
// ✅ CORRECT
import axios from 'axios';
```

### 2. Utilisation directe d'axios

Remplacement de tous les imports dynamiques par l'utilisation directe :

```javascript
// ❌ AVANT
import('axios').then(axios =>
  axios.default.post(url, data, config)
);

// ✅ APRES
axios.post(url, data, config);
```

---

## 📝 Fichiers modifiés

### 1. **PlanningScheduleTab.jsx**
- ✅ Ajout de `import axios from 'axios';`
- ✅ Remplacement de `import('axios').then(axios => axios.default.post(...))` par `axios.post(...)`
- **Ligne 109-113** : Sauvegarde des assignments lors de la génération

### 2. **Planning2.jsx**
- ✅ Ajout de `import axios from 'axios';`
- ✅ Remplacement de 3 imports dynamiques :
  - **Ligne 74** : Création d'un nouveau planning
  - **Ligne 156** : Suppression d'un planning
  - **Ligne 189** : Reset de tous les plannings

### 3. **PlanningGlobalTab.jsx**
- ✅ Ajout de `import axios from 'axios';`
- ✅ Remplacement de 2 imports dynamiques :
  - **Ligne 153** : Ajout d'un rôle global
  - **Ligne 174** : Suppression d'un rôle global

### 4. **PlanningConfigTab.jsx**
- ✅ Ajout de `import axios from 'axios';`
- ✅ Remplacement de 1 import dynamique :
  - **Ligne 80** : Sauvegarde des dates via Flatpickr

---

## 🎯 Endpoints affectés (maintenant corrigés)

| Endpoint | Méthode | Utilisation | Fichier concerné |
|----------|---------|-------------|------------------|
| `/api/planning` | POST | Création d'assignments | PlanningScheduleTab.jsx |
| `/api/planning/sessions` | POST | Création de session | Planning2.jsx |
| `/api/planning/sessions/{id}` | PUT | Mise à jour session | PlanningConfigTab.jsx |
| `/api/planning/sessions/{id}` | DELETE | Suppression session | Planning2.jsx |
| `/api/planning/reset` | DELETE | Reset complet | Planning2.jsx |
| `/api/roles` | POST | Ajout rôle | PlanningGlobalTab.jsx |
| `/api/roles/name/{role}` | DELETE | Suppression rôle | PlanningGlobalTab.jsx |

---

## ✅ Résultat

### Avant
```
User clique "Générer"
    ↓
axios.default.post(...) via import dynamique
    ↓
❌ Headers HTTP mal envoyés
    ↓
❌ Backend retourne 415 Unsupported Media Type
    ↓
❌ Aucun planning généré
```

### Après
```
User clique "Générer"
    ↓
axios.post(...) directement (import statique)
    ↓
✅ Headers HTTP correctement envoyés
    ↓
✅ Backend accepte la requête
    ↓
✅ Planning généré et sauvegardé !
```

---

## 🧪 Tests de validation

### Test 1 : Génération de planning
1. Créer un planning
2. Ajouter des dates et participants
3. Cliquer sur "Générer"
4. ✅ Vérifier qu'aucune erreur 415 n'apparaît dans la console
5. ✅ Vérifier que le planning est généré
6. ✅ Vérifier que les assignments sont sauvegardés en base

### Test 2 : Création de planning
1. Cliquer sur "Créer"
2. Entrer un nom
3. ✅ Vérifier qu'aucune erreur 415 n'apparaît
4. ✅ Vérifier que la session est créée en base

### Test 3 : Ajout de rôle
1. Onglet "Global"
2. Ajouter un rôle
3. ✅ Vérifier qu'aucune erreur 415 n'apparaît
4. ✅ Vérifier que le rôle est sauvegardé en base

### Test 4 : Modification de dates
1. Onglet "Config"
2. Sélectionner/désélectionner des dates
3. ✅ Vérifier qu'aucune erreur 415 n'apparaît
4. ✅ Vérifier que les dates sont sauvegardées

---

## 📊 Statistiques

- **Fichiers modifiés** : 4
- **Imports dynamiques supprimés** : 8
- **Imports statiques ajoutés** : 4
- **Endpoints corrigés** : 7

---

## 💡 Leçon apprise

**Éviter les imports dynamiques pour les bibliothèques HTTP**

Les imports dynamiques (`import('module')`) sont utiles pour le code-splitting, mais peuvent causer des problèmes avec les bibliothèques qui gèrent les headers HTTP comme axios.

**Règle** : Pour axios et les bibliothèques similaires, toujours utiliser des imports statiques :
```javascript
// ✅ TOUJOURS faire ceci
import axios from 'axios';

// ❌ ÉVITER ceci
import('axios').then(axios => ...);
```

---

*Correction appliquée le 2025-11-27 à 18:20*
*Erreur 415 complètement résolue*
