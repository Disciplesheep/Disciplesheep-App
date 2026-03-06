import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PH_PROVINCES = [
  'Abra','Agusan del Norte','Agusan del Sur','Aklan','Albay','Antique','Apayao',
  'Aurora','Basilan','Bataan','Batanes','Batangas','Benguet','Biliran',
  'Bohol','Bukidnon','Bulacan','Cagayan','Camarines Norte','Camarines Sur',
  'Camiguin','Capiz','Catanduanes','Cavite','Cebu','Compostela Valley',
  'Cotabato','Davao de Oro','Davao del Norte','Davao del Sur','Davao Occidental',
  'Davao Oriental','Dinagat Islands','Eastern Samar','Guimaras','Ifugao',
  'Ilocos Norte','Ilocos Sur','Iloilo','Isabela','Kalinga','La Union',
  'Laguna','Lanao del Norte','Lanao del Sur','Leyte','Maguindanao',
  'Marinduque','Masbate','Metro Manila','Misamis Occidental','Misamis Oriental',
  'Mountain Province','Negros Occidental','Negros Oriental','Northern Samar',
  'Nueva Ecija','Nueva Vizcaya','Occidental Mindoro','Oriental Mindoro',
  'Palawan','Pampanga','Pangasinan','Quezon','Quirino','Rizal','Romblon',
  'Samar','Sarangani','Siquijor','Sorsogon','South Cotabato','Southern Leyte',
  'Sultan Kudarat','Sulu','Surigao del Norte','Surigao del Sur','Tarlac',
  'Tawi-Tawi','Zambales','Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay',
];

const PH_CITIES = {
  'Palawan': [
    'Puerto Princesa City','Aborlan','Agutaya','Araceli','Balabac','Bataraza',
    "Brooke's Point",'Busuanga','Cagayancillo','Coron','Culion','Cuyo',
    'Dumaran','El Nido','Española','Linapacan','Magsaysay','Narra',
    'Quezon','Rizal','Roxas','San Abad Santos','San Vicente','Sofronio Española','Taytay',
  ],
  'Metro Manila': [
    'Caloocan','Las Piñas','Makati','Malabon','Mandaluyong','Manila',
    'Marikina','Muntinlupa','Navotas','Parañaque','Pasay','Pasig',
    'Pateros','Quezon City','San Juan','Taguig','Valenzuela',
  ],
  'Cebu': [
    'Cebu City','Mandaue City','Lapu-Lapu City','Talisay City','Toledo City',
    'Naga City','Carcar City','Danao City','Badian','Balamban','Bantayan',
    'Barili','Bogo City','Consolacion','Cordova','Liloan','Minglanilla','Moalboal','San Fernando',
  ],
  'Davao del Sur': [
    'Davao City','Digos City','Bansalan','Don Marcelino','Hagonoy',
    'Jose Abad Santos','Kiblawan','Magsaysay','Malalag','Matanao',
    'Padada','Santa Cruz','Sulop',
  ],
  'Iloilo': [
    'Iloilo City','Passi City','Ajuy','Alimodian','Anilao','Badiangan',
    'Balasan','Banate','Barotac Nuevo','Barotac Viejo','Batad','Bingawan',
    'Cabatuan','Calinog','Carles','Concepcion','Dingle','Dueñas','Dumangas',
    'Estancia','Guimbal','Igbaras','Janiuay','Lambunao','Leganes','Lemery',
    'Leon','Maasin','Miag-ao','Mina','New Lucena','Oton','Pavia','Pototan',
    'San Dionisio','San Enrique','San Joaquin','San Miguel','San Rafael',
    'Santa Barbara','Sara','Tigbauan','Tubungan','Zarraga',
  ],
  'Bulacan': [
    'Malolos City','Meycauayan City','San Jose del Monte City','Angat','Balagtas',
    'Baliuag','Bocaue','Bulacan','Bustos','Calumpit','Doña Remedios Trinidad',
    'Guiguinto','Hagonoy','Marilao','Norzagaray','Obando','Pandi','Paombong',
    'Plaridel','Pulilan','San Ildefonso','San Miguel','San Rafael','Santa Maria',
  ],
  'Laguna': [
    'San Pablo City','Santa Cruz','Biñan City','Calamba City','San Pedro City',
    'Santa Rosa City','Alaminos','Bay','Cabuyao City','Calauan','Cavinti','Famy',
    'Kalayaan','Liliw','Los Baños','Luisiana','Lumban','Mabitac','Magdalena',
    'Majayjay','Nagcarlan','Paete','Pagsanjan','Pakil','Pangil','Pila','Rizal',
    'Santa Maria','Siniloan','Victoria',
  ],
  'Cavite': [
    'Cavite City','Tagaytay City','Trece Martires City','Bacoor City',
    'Dasmariñas City','General Trias City','Imus City','Alfonso','Amadeo',
    'Carmen','Carmona','General Emilio Aguinaldo','General Mariano Alvarez',
    'Indang','Kawit','Magallanes','Maragondon','Mendez','Naic','Noveleta',
    'Rosario','Silang','Tanza','Ternate',
  ],
  'Pampanga': [
    'Angeles City','San Fernando City','Mabalacat City','Apalit','Arayat',
    'Bacolor','Candaba','Floridablanca','Guagua','Lubao','Macabebe',
    'Magalang','Masantol','Mexico','Minalin','Porac','San Luis','San Simon',
    'Santa Ana','Santa Rita','Santo Tomas','Sasmuan',
  ],
  'Rizal': [
    'Antipolo City','Angono','Baras','Binangonan','Cainta','Cardona',
    'Jala-Jala','Morong','Pililla','Rodriguez','San Mateo','Tanay','Taytay','Teresa',
  ],
};

const PH_BRGYS = {
  'Puerto Princesa City': [
    'Bacungan','Bagong Pag-asa','Bagong Silang','Bahile','Bancao-Bancao',
    'Barangay 1 (Poblacion)','Barangay 2 (Poblacion)','Barangay 3 (Poblacion)',
    'Barangay 4 (Poblacion)','Barangay 5 (Poblacion)','Barangay 6 (Poblacion)',
    'Barangay 7 (Poblacion)','Barangay 8 (Poblacion)','Barangay 9 (Poblacion)',
    'Barangay 10 (Poblacion)','Binduyan','Buenavista','Cabayugan','Concepcion',
    'Inagawan','Irawan','Iwahig','Kalipay','Kamuning','Langogan','Liwanag',
    'Lucbuan','Luzviminda','Macarascas','Maoyon','Marufinas','Masipag','Matiyaga',
    'Milagrosa','Modelo','Montible','Napsan','New Panggangan','Pagkakaisa',
    'San Jose','San Manuel','San Miguel','San Pedro','San Rafael','Santa Cruz',
    'Santa Lourdes','Santa Lucia','Santa Monica','Sicsican','Simpocan',
    'Tagburos','Tagumpay','Tanabag','Tanglaw','Tiniguiban','Tres Palmas',
  ],
  'Quezon City': [
    'Bagong Silangan','Bagumbayan','Batasan Hills','Commonwealth','Culiat',
    'Damayang Lagi','Fairview','Holy Spirit','Kamuning','Katipunan',
    'Kristong Hari','Krus na Ligas','Laging Handa','Libis','Malaya',
    'Matandang Balara','New Era','Novaliches Proper','Payatas','Project 6',
    'Roxas','Sacred Heart','San Agustin','San Antonio','San Bartolome',
    'San Isidro Labrador','San Jose','Santo Domingo','Sauyo','Sikatuna Village',
    'South Triangle','Tatalon','Teachers Village East','Teachers Village West',
    'UP Campus','Valencia','West Triangle','White Plains',
  ],
  'Manila': [
    'Binondo','Ermita','Intramuros','Malate','Paco','Pandacan',
    'Port Area','Quiapo','Sampaloc','San Andres Bukid','San Miguel',
    'San Nicolas','Santa Ana','Santa Cruz','Santa Mesa','Tondo',
  ],
  'Makati': [
    'Bangkal','Bel-Air','Carmona','Cembo','Comembo','Dasmariñas','East Rembo',
    'Forbes Park','Guadalupe Nuevo','Guadalupe Viejo','Kasilawan','La Paz',
    'Magallanes','Olympia','Palanan','Pinagkaisahan','Pio del Pilar','Pitogo',
    'Poblacion','Post Proper Northside','Post Proper Southside','Rembo',
    'San Antonio','San Isidro','San Lorenzo','Santa Cruz','Singkamas',
    'South Cembo','Tejeros','Urdaneta','Valenzuela','West Rembo',
  ],
  'Cebu City': [
    'Apas','Banilad','Basak Pardo','Basak San Nicolas','Bonbon','Budlaan',
    'Busay','Calamba','Capitol Site','Carreta','Cogon Pardo','Cogon Ramos',
    'Day-as','Ermita','Guadalupe','Guba','Hippodromo','Inayawan','Kalubihan',
    'Kasambagan','Kinasang-an','Labangon','Lahug','Lorega','Lusaran','Luz',
    'Mabini','Mabolo','Malubog','Mambaling','Pahina Central','Pamutan','Pardo',
    'Pari-an','Pasil','Pit-os','Poblacion Pardo','Pulangbato','Punta Princesa',
    'Sambag I','Sambag II','San Antonio','San Jose','San Nicolas Central',
    'San Roque','Santa Cruz','Santo Nino','Sapangdaku','Sirao','Talamban',
    'Taptap','Tejero','Tinago','Tisa','Zapatera',
  ],
  'Davao City': [
    'Agdao','Bago Aplaya','Bago Gallera','Bago Oshiro','Baguio','Bajada',
    'Barangay 1-A','Barangay 2-A','Barangay 3-A','Barangay 4-A','Barangay 5-A',
    'Barangay 6-A','Barangay 7-A','Barangay 8-A','Barangay 9-A','Barangay 10-A',
    'Buhangin','Bunawan','Calinan','Communal','Datu Salumay','Gatungan',
    'Indangan','Lasang','Leon Garcia','Lizada','Los Amigos','Lubogan',
    'Ma-a','Mabuhay','Magsaysay','Magtuod','Mahayag','Malabog','Malagos',
    'Mandug','Manuel Guianga','Mapula','Marilog','Matina Aplaya',
    'Matina Crossing','Matina Pangi','Mintal','New Carmen','New Valencia',
    'Panacan','Paquibato','Rafael Castillo','San Antonio','San Isidro',
    'Santo Niño','Sasa','Tacunan','Talomo','Tamugan','Tibungco','Tigatto',
    'Toril','Tugbok','Ula','Wangan',
  ],
  'Iloilo City': [
    'Arevalo','Bonifacio','Buhang','City Proper','Concepcion','Jaro',
    'La Paz','Lapuz','Mandurriao','Molo','Oton','Sambag','San Isidro',
    'Santa Barbara','Tabucan','Tacas','Ungka','Yulo Drive','Zona Sur',
  ],
  'Angeles City': [
    'Agapito del Rosario','Amsic','Anunas','Balibago','Capaya','Claro M. Recto',
    'Cuayan','Cutcut','Cutud','Lourdes Norte','Lourdes Sur','Lourdes Sur East',
    'Malabanias','Margot','Mining','Ninoy Aquino','Pampang','Pandan','Pulung Bulu',
    'Pulung Cacutud','Pulung Maragul','Salapungan','San Jose','San Nicolas',
    'Santa Teresita','Santa Trinidad','Santo Cristo','Santo Domingo','Santo Rosario',
    'Sapalibutad','Sapangbato','Tabun','Virgen delos Remedios',
  ],
  'Antipolo City': [
    'Bagong Nayon','Beverly Hills','Calawis','Cupang','Dalig','Dela Paz',
    'Inarawan','Mambugan','Mayamot','Muntingdilaw','San Isidro','San Jose',
    'San Juan','San Luis','San Roque','Santa Cruz','Sta. Cruz','Tibay',
  ],
};

const OTHER = '__other__';

export const emptyAddress = {
  street: '', barangay: '', city: 'Puerto Princesa City', province: 'Palawan',
};

export const composeAddress = ({ street, barangay, city, province } = {}) =>
  [street, barangay ? `Brgy. ${barangay}` : '', city, province]
    .filter(Boolean).join(', ');

export const parseAddress = (addr) => {
  if (!addr || typeof addr === 'object') return addr || {};
  return { street: addr, barangay: '', city: '', province: '' };
};

const AddressFields = ({ value, onChange, ic }) => {
  const [manualBrgy,     setManualBrgy]     = useState(false);
  const [manualCity,     setManualCity]     = useState(false);
  const [manualProvince, setManualProvince] = useState(false);

  useEffect(() => {
    const cities = value.province ? (PH_CITIES[value.province] || []) : [];
    const brgys  = value.city     ? (PH_BRGYS[value.city]     || []) : [];
    setManualProvince(!!value.province && !PH_PROVINCES.includes(value.province));
    setManualCity(!!value.city && cities.length > 0 && !cities.includes(value.city));
    setManualBrgy(!!value.barangay && brgys.length > 0 && !brgys.includes(value.barangay));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, val) => onChange({ ...value, [key]: val });
  const availableCities = value.province ? (PH_CITIES[value.province] || []) : [];
  const availableBrgys  = value.city     ? (PH_BRGYS[value.city]     || []) : [];
  const sub = "text-xs text-stone-400 dark:text-stone-500 uppercase tracking-widest font-semibold mb-1 block";

  return (
    <div className="space-y-3 p-3 bg-stone-50 dark:bg-stone-700/40 rounded-xl border border-stone-200 dark:border-stone-600">

      <div>
        <span className={sub}>Street / Purok / Sitio</span>
        <Input type="text" value={value.street || ''}
          onChange={e => set('street', e.target.value)}
          placeholder="e.g. 123 Rizal St., Purok 4" className={ic} />
      </div>

      <div>
        <span className={sub}>Province</span>
        {manualProvince ? (
          <div className="flex gap-2">
            <Input type="text" value={value.province || ''}
              onChange={e => set('province', e.target.value)}
              placeholder="Type province name" className={`${ic} flex-1`} />
            <Button type="button" variant="ghost" size="sm"
              onClick={() => { setManualProvince(false); onChange({ ...value, province: '', city: '', barangay: '' }); }}
              className="text-xs text-stone-400 hover:text-red-500 shrink-0 px-2">✕</Button>
          </div>
        ) : (
          <Select value={value.province || ''} onValueChange={v => {
            if (v === OTHER) { setManualProvince(true); onChange({ ...value, province: '', city: '', barangay: '' }); }
            else { onChange({ ...value, province: v, city: '', barangay: '' }); setManualCity(false); setManualBrgy(false); }
          }}>
            <SelectTrigger className={`${ic} w-full`}><SelectValue placeholder="Select province" /></SelectTrigger>
            <SelectContent>
              {PH_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              <SelectItem value={OTHER} className="text-stone-400 italic">Other (type manually)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <span className={sub}>City / Municipality</span>
        {(manualCity || availableCities.length === 0) ? (
          <div className="flex gap-2">
            <Input type="text" value={value.city || ''}
              onChange={e => set('city', e.target.value)}
              placeholder="Type city or municipality" className={`${ic} flex-1`} />
            {availableCities.length > 0 && (
              <Button type="button" variant="ghost" size="sm"
                onClick={() => { setManualCity(false); onChange({ ...value, city: '', barangay: '' }); setManualBrgy(false); }}
                className="text-xs text-stone-400 hover:text-red-500 shrink-0 px-2">✕</Button>
            )}
          </div>
        ) : (
          <Select value={value.city || ''} onValueChange={v => {
            if (v === OTHER) { setManualCity(true); onChange({ ...value, city: '', barangay: '' }); }
            else { onChange({ ...value, city: v, barangay: '' }); setManualBrgy(false); }
          }}>
            <SelectTrigger className={`${ic} w-full`}><SelectValue placeholder="Select city / municipality" /></SelectTrigger>
            <SelectContent>
              {availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              <SelectItem value={OTHER} className="text-stone-400 italic">Other (type manually)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <span className={sub}>Barangay</span>
        {(manualBrgy || availableBrgys.length === 0) ? (
          <div className="flex gap-2">
            <Input type="text" value={value.barangay || ''}
              onChange={e => set('barangay', e.target.value)}
              placeholder="Type barangay name" className={`${ic} flex-1`} />
            {availableBrgys.length > 0 && (
              <Button type="button" variant="ghost" size="sm"
                onClick={() => { setManualBrgy(false); set('barangay', ''); }}
                className="text-xs text-stone-400 hover:text-red-500 shrink-0 px-2">✕</Button>
            )}
          </div>
        ) : (
          <Select value={value.barangay || ''} onValueChange={v => {
            if (v === OTHER) { setManualBrgy(true); set('barangay', ''); }
            else set('barangay', v);
          }}>
            <SelectTrigger className={`${ic} w-full`}><SelectValue placeholder="Select barangay" /></SelectTrigger>
            <SelectContent>
              {availableBrgys.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              <SelectItem value={OTHER} className="text-stone-400 italic">Other (type manually)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default AddressFields;