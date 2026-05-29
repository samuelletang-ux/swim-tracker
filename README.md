# SwimTrack 🏊

Application de suivi des chronos de natation pour mon fils nageur.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
swim-tracker/
├── app/
│   ├── page.tsx              # Dashboard — vue d'ensemble
│   ├── results/
│   │   ├── page.tsx          # Historique de tous les résultats
│   │   └── new/page.tsx      # Formulaire de saisie d'un chrono
│   ├── progress/page.tsx     # Graphiques de progression par épreuve
│   └── layout.tsx            # Layout global + navbar
├── components/
│   ├── NavBar.tsx            # Barre de navigation
│   ├── ResultCard.tsx        # Carte d'un résultat
│   └── ProgressChart.tsx     # Graphique de progression (Recharts)
├── lib/
│   ├── types.ts              # Types TypeScript + helpers temps
│   └── storage.ts            # Couche de données (localStorage)
└── hooks/
    └── useResults.ts         # Hook React pour accéder aux données
```

## Ce qui est déjà là

- ✅ Dashboard avec stats rapides et résultats récents
- ✅ Formulaire de saisie : nage, distance, bassin, temps (min:sec.centièmes), date, lieu, notes
- ✅ Calcul automatique des records personnels (PB)
- ✅ Historique avec filtres (nage, distance, bassin, tri)
- ✅ Graphique de progression par épreuve
- ✅ Données de démo pour voir l'app en action

## Prochaines étapes

- [ ] **Auth** — Ajouter Supabase Auth pour un compte sécurisé
- [ ] **Base de données** — Remplacer `lib/storage.ts` par des appels Supabase/Postgres
- [ ] **Compétitions** — Créer une "compétition" regroupant plusieurs épreuves
- [ ] **Objectifs** — Fixer des temps cibles par épreuve
- [ ] **PWA** — Installer l'app sur le téléphone
- [ ] **Partage** — Partager sa progression avec son entraîneur

## Passer à une vraie base de données

Tout le code d'accès aux données est isolé dans `lib/storage.ts`.
Pour migrer vers Supabase, il suffit de remplacer les fonctions de ce fichier par des appels API — le reste de l'app ne change pas.

```bash
npm install @supabase/supabase-js
```
