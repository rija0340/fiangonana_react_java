import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Home from '../pages/Home';
import MembreList from '../features/membre/components/List';
import  MembreCreate  from '../features/membre/components/Create';
import MembreEdit from '../features/membre/components/Edit';
import  MembreDelete  from '../features/membre/components/Delete';
import Membre from '../pages/Membre';
import MembreXlsxImport from '../features/membre/components/XlsxImport';
import Kilasy from '../pages/Kilasy';
import KilasyList from '../features/kilasy/KilasyList';
import KilasyCreate from '../features/kilasy/KilasyCreate';
import KilasyEdit from '../features/kilasy/KilasyEdit';
import KilasyDelete from '../features/kilasy/KilasyDelete';
import Famille from '../pages/Famille';
import FamilleList from '../features/famille/components/List';
import FamilleCreate from '../features/famille/components/Create';
import FamilleEdit from '../features/famille/components/Edit';


export const router = createBrowserRouter([
    {
        path: '/',
        element: <Dashboard />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: 'membres',
                element: <Membre />, // ✅ composant parent
                children: [
                  {
                    index: true,
                    element: <MembreList />
                  },
                  {
                    path: 'new',
                    element: <MembreCreate />
                  },
                  {
                    path: 'edit/:id',
                    element: <MembreEdit />
                  },
                  {
                    path: 'delete/:id',
                    element: <MembreDelete />
                  },
                  {
                    path: 'import-xslx',
                    element: <MembreXlsxImport />
                  }
                ]
              },
               {
                path: 'kilasys',
                element: <Kilasy />, // ✅ composant parent
                children: [
                  {
                    index: true,
                    element: <KilasyList />
                  },
                  {
                    path: 'new',
                    element: <KilasyCreate />
                  },
                  {
                    path: 'edit/:id',
                    element: <KilasyEdit />
                  },
                  {
                    path: 'delete/:id',
                    element: <KilasyDelete />
                  }

                ]
              },
              {
                path: 'familles',
                element: <Famille />, // ✅ composant parent
                children: [
                  {
                    index: true,
                    element: <FamilleList />
                  },
                  {
                    path: 'new',
                    element: <FamilleCreate />
                  },
                   {
                    path: 'edit/:id',
                    element: <FamilleEdit />
                  },
                ]
              }
        ]
    }
]); 
