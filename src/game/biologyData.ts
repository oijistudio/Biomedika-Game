import { ZoneIndex } from './types';

export interface BioEntry {
  id: string;
  title: string;
  category: 'Anatomi' | 'Sel & Darah' | 'Sistem Saraf' | 'Patogen';
  zone: ZoneIndex;
  shortFact: string;
  detail: string;
}

export interface BioQuizQuestion {
  id: string;
  zone: ZoneIndex;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const BIO_ENTRIES: BioEntry[] = [
  {
    id: 'oral_mucosa',
    title: 'Rongga Mulut & Enzim Amilase',
    category: 'Anatomi',
    zone: 0,
    shortFact: 'Air liur (saliva) mengandung enzim amilase dan lisozim yang memecah karbohidrat serta membunuh bakteri awal.',
    detail:
      'Rongga mulut adalah gerbang pertama sistem pencernaan dan pertahanan tubuh. Selain gigi yang menghancurkan makanan secara mekanis, kelenjar ludah menyekresikan enzim ptialin (amilase) dan antibodi IgA untuk menahan mikroba masuk.',
  },
  {
    id: 'rhinovirus',
    title: 'Rhinovirus-Alpha (Virus Kapsid)',
    category: 'Patogen',
    zone: 0,
    shortFact: 'Virus tidak memiliki sel sendiri; ia membajak sel inang menggunakan protein paku (spike) di kapsidnya.',
    detail:
      'Rhinovirus berbentuk ikosahedral dengan selubung protein (kapsid) yang melindungi materi genetik RNA. Radiasi UV-C dan respons antibodi mukosa dapat merusak struktur kapsid sehingga virus gagal bereplikasi.',
  },
  {
    id: 'erythrocyte',
    title: 'Eritrosit (Sel Darah Merah)',
    category: 'Sel & Darah',
    zone: 1,
    shortFact: 'Bentuk bikonkaf tanpa inti sel membuat eritrosit sangat fleksibel melewati kapiler dan maksimal mengikat oksigen.',
    detail:
      'Eritrosit mengandung jutaan molekul hemoglobin kaya zat besi (Fe) yang mengikat oksigen di paru-paru dan mengantarkannya ke seluruh jaringan tubuh. Umurnya sekitar 120 hari sebelum didaur ulang di limpa.',
  },
  {
    id: 'spore_bacteria',
    title: 'Bakteri Berspora (Spore-Drifter)',
    category: 'Patogen',
    zone: 1,
    shortFact: 'Beberapa bakteri memakai flagela untuk berenang di aliran darah dan membentuk dinding pelindung terhadap suhu tinggi.',
    detail:
      'Berbeda dengan virus, bakteri adalah organisme bersel tunggal (prokariotik). Flagela membantunya bergerak menembus aliran plasma darah. Pendinginan lokal (cryo) memperlambat metabolisme dan pergerakan flagelanya.',
  },
  {
    id: 'neuron_myelin',
    title: 'Neuron & Selubung Mielin',
    category: 'Sistem Saraf',
    zone: 2,
    shortFact: 'Selubung mielin membungkus akson saraf seperti isolator kabel agar impuls listrik melesat hingga 120 m/detik.',
    detail:
      'Sistem Saraf Pusat mengoordinasikan seluruh organ tubuh melalui sinyal elektrokimia (potensial aksi) antar-sinapsis. Kerusakan mielin atau infeksi saraf membuat hantaran sinyal melambat drastis.',
  },
  {
    id: 'neuro_parasite',
    title: 'Neuro-Parasit Vektor',
    category: 'Patogen',
    zone: 2,
    shortFact: 'Patogen neurotropik dapat mengganggu pelepasan neurotransmiter di celah sinapsis saraf.',
    detail:
      'Patogen yang berhasil menembus sawar darah-otak menyerang jaringan saraf dengan mengganggu gradien ion natrium-kalium, memicu gangguan sinyal motorik dan demam tinggi pada pasien.',
  },
  {
    id: 'heart_myocardium',
    title: 'Jantung, Katup & Nodus Sinoatrial',
    category: 'Anatomi',
    zone: 3,
    shortFact: 'Nodus Sinoatrial (SA Node) adalah alat pacu jantung alami yang memicu 100.000 detak jantung per hari.',
    detail:
      'Otot jantung (miokardium) bekerja tanpa lelah memompa darah beroksigen ke seluruh tubuh. Empat katup jantung membuka dan menutup satu arah untuk mencegah darah mengalir balik.',
  },
  {
    id: 'chrono_omega',
    title: 'Sistem Imun & Antibodi Adaptif',
    category: 'Sel & Darah',
    zone: 3,
    shortFact: 'Sel T-Pembunuh dan antibodi menandai perisai patogen kompleks agar dapat dihancurkan tanpa merusak sel sehat.',
    detail:
      'Saat menghadapi patogen bermutasi seperti Chrono-Virus Omega, tubuh membutuhkan penghancuran reseptor pelindungnya terlebih dahulu sebelum inti patogen dapat dinetralkan sepenuhnya.',
  },
];

export const BIO_QUIZZES: BioQuizQuestion[] = [
  {
    id: 'q_oral',
    zone: 0,
    question: 'Enzim pada air liur (saliva) yang membantu menghancurkan dinding sel bakteri di rongga mulut adalah...',
    options: ['Lisozim', 'Pepsin', 'Insulin'],
    correctIndex: 0,
    explanation: 'Tepat! Lisozim pada air liur mampu melisiskan (memecah) dinding sel bakteri yang masuk melalui mulut.',
  },
  {
    id: 'q_blood',
    zone: 1,
    question: 'Mengapa sel darah merah (eritrosit) manusia berbentuk cakram bikonkaf dan tidak memiliki inti sel?',
    options: [
      'Agar bisa membelah diri di pembuluh darah',
      'Memaksimalkan luas permukaan untuk mengikat oksigen (Hb)',
      'Untuk menyimpan cadangan lemak tubuh',
    ],
    correctIndex: 1,
    explanation: 'Benar! Bentuk bikonkaf tanpa inti memaksimalkan ruang hemoglobin pengikat oksigen dan kelenturan di kapiler.',
  },
  {
    id: 'q_cns',
    zone: 2,
    question: 'Bagian sel saraf (neuron) yang berfungsi mempercepat loncatan impuls listrik di sepanjang akson disebut...',
    options: ['Selubung Mielin', 'Alveolus', 'Trombosit'],
    correctIndex: 0,
    explanation: 'Brilian! Selubung mielin berperan sebagai isolator biologis yang mempercepat hantaran potensial aksi saraf.',
  },
];
