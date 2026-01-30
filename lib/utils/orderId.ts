/**
 * Order ID Generator Utility
 * 
 * Format: {STATE}{RTO}{WT}{CATEGORY}{SEQUENCE}
 * Example: TN37WTDSLR1001
 * 
 * - First 2 letters: State code (e.g., TN)
 * - 3rd-4th letters: RTO number based on pincode (e.g., 37 for 641004)
 * - 5th-6th letters: "WT" (WorthyTen)
 * - 7th-10th letters: Category code
 * - 11th-14th letters: Sequential order number starting from 1001
 */

import { getFirestoreServer } from '@/lib/firebase/server'
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore'

/**
 * Pincode ranges to State and RTO mapping
 * Format: { startPincode, endPincode, stateCode, rtoNumber }
 */
interface PincodeRange {
  start: number
  end: number
  state: string
  rto: string
}

// Comprehensive pincode to state and RTO mapping
// Tamil Nadu RTO codes: Official RTO codes for all 38 districts
// Reference: https://en.wikipedia.org/wiki/List_of_RTO_districts_in_India#Tamil_Nadu
const PINCODE_RANGES: PincodeRange[] = [
  // ============================================
  // TAMIL NADU (TN) - ALL DISTRICTS COMPLETE
  // ============================================
  
  // CHENNAI REGION (TN-01 to TN-22)
  // Chennai North - TN-01 (Anna Nagar, Perambur, Tondiarpet, Royapuram)
  { start: 600001, end: 600012, state: 'TN', rto: '01' },
  { start: 600021, end: 600021, state: 'TN', rto: '01' },
  { start: 600039, end: 600039, state: 'TN', rto: '01' },
  { start: 600081, end: 600081, state: 'TN', rto: '01' },
  { start: 600108, end: 600108, state: 'TN', rto: '01' },
  
  // Chennai South - TN-02 (Adyar, Velachery, Guindy, T Nagar)
  { start: 600013, end: 600020, state: 'TN', rto: '02' },
  { start: 600022, end: 600032, state: 'TN', rto: '02' },
  { start: 600041, end: 600042, state: 'TN', rto: '02' },
  { start: 600083, end: 600083, state: 'TN', rto: '02' },
  { start: 600088, end: 600088, state: 'TN', rto: '02' },
  { start: 600090, end: 600091, state: 'TN', rto: '02' },
  { start: 600093, end: 600093, state: 'TN', rto: '02' },
  { start: 600096, end: 600097, state: 'TN', rto: '02' },
  { start: 600113, end: 600113, state: 'TN', rto: '02' },
  { start: 600119, end: 600119, state: 'TN', rto: '02' },
  
  // Chennai West - TN-03 (Ambattur, Avadi, Poonamallee)
  { start: 600053, end: 600058, state: 'TN', rto: '03' },
  { start: 600062, end: 600062, state: 'TN', rto: '03' },
  { start: 600077, end: 600077, state: 'TN', rto: '03' },
  { start: 600095, end: 600095, state: 'TN', rto: '03' },
  { start: 600098, end: 600098, state: 'TN', rto: '03' },
  { start: 600101, end: 600101, state: 'TN', rto: '03' },
  { start: 600106, end: 600107, state: 'TN', rto: '03' },
  { start: 600110, end: 600110, state: 'TN', rto: '03' },
  { start: 600116, end: 600118, state: 'TN', rto: '03' },
  
  // Chennai East - TN-04 (Mylapore, Triplicane, Nungambakkam)
  { start: 600004, end: 600005, state: 'TN', rto: '04' },
  { start: 600033, end: 600038, state: 'TN', rto: '04' },
  { start: 600040, end: 600040, state: 'TN', rto: '04' },
  { start: 600086, end: 600086, state: 'TN', rto: '04' },
  
  // Chennai Central - TN-05 (Egmore, Park Town, Periamet)
  { start: 600003, end: 600003, state: 'TN', rto: '05' },
  { start: 600008, end: 600009, state: 'TN', rto: '05' },
  
  // Tambaram - TN-09 (Tambaram, Chromepet, Pallavaram)
  { start: 600043, end: 600048, state: 'TN', rto: '09' },
  { start: 600063, end: 600064, state: 'TN', rto: '09' },
  { start: 600069, end: 600069, state: 'TN', rto: '09' },
  { start: 600073, end: 600073, state: 'TN', rto: '09' },
  { start: 600100, end: 600100, state: 'TN', rto: '09' },
  { start: 600122, end: 600127, state: 'TN', rto: '09' },
  
  // Sholinganallur - TN-10 (OMR, Sholinganallur, Perungudi)
  { start: 600096, end: 600096, state: 'TN', rto: '10' },
  { start: 600119, end: 600119, state: 'TN', rto: '10' },
  
  // Madhavaram - TN-12 (Madhavaram, Red Hills)
  { start: 600051, end: 600052, state: 'TN', rto: '12' },
  { start: 600060, end: 600060, state: 'TN', rto: '12' },
  { start: 600066, end: 600067, state: 'TN', rto: '12' },
  
  // Poonamallee - TN-18 (Poonamallee, Porur)
  { start: 600056, end: 600056, state: 'TN', rto: '18' },
  { start: 600116, end: 600116, state: 'TN', rto: '18' },
  
  // Kancheepuram - TN-14
  { start: 603001, end: 603399, state: 'TN', rto: '14' },
  { start: 631501, end: 631599, state: 'TN', rto: '14' },
  
  // Tiruvallur - TN-15
  { start: 600049, end: 600050, state: 'TN', rto: '15' },
  { start: 600059, end: 600059, state: 'TN', rto: '15' },
  { start: 600061, end: 600061, state: 'TN', rto: '15' },
  { start: 600065, end: 600065, state: 'TN', rto: '15' },
  { start: 600068, end: 600068, state: 'TN', rto: '15' },
  { start: 600070, end: 600072, state: 'TN', rto: '15' },
  { start: 600074, end: 600076, state: 'TN', rto: '15' },
  { start: 600078, end: 600080, state: 'TN', rto: '15' },
  { start: 600082, end: 600082, state: 'TN', rto: '15' },
  { start: 600084, end: 600085, state: 'TN', rto: '15' },
  { start: 600087, end: 600087, state: 'TN', rto: '15' },
  { start: 600089, end: 600089, state: 'TN', rto: '15' },
  { start: 600092, end: 600092, state: 'TN', rto: '15' },
  { start: 600094, end: 600094, state: 'TN', rto: '15' },
  { start: 600099, end: 600099, state: 'TN', rto: '15' },
  { start: 600102, end: 600105, state: 'TN', rto: '15' },
  { start: 600109, end: 600109, state: 'TN', rto: '15' },
  { start: 600111, end: 600112, state: 'TN', rto: '15' },
  { start: 600114, end: 600115, state: 'TN', rto: '15' },
  { start: 600120, end: 600121, state: 'TN', rto: '15' },
  { start: 601101, end: 601299, state: 'TN', rto: '15' },
  { start: 602001, end: 602999, state: 'TN', rto: '15' },
  { start: 631001, end: 631499, state: 'TN', rto: '15' },
  
  // Chengalpattu - TN-16
  { start: 603101, end: 603999, state: 'TN', rto: '16' },
  
  // Ranipet - TN-17
  { start: 631601, end: 631999, state: 'TN', rto: '17' },
  { start: 632401, end: 632499, state: 'TN', rto: '17' },
  
  // NORTHERN REGION
  // Vellore - TN-23
  { start: 632001, end: 632399, state: 'TN', rto: '23' },
  { start: 632501, end: 632999, state: 'TN', rto: '23' },
  
  // Tiruvannamalai - TN-24
  { start: 604501, end: 604999, state: 'TN', rto: '24' },
  { start: 606001, end: 606999, state: 'TN', rto: '24' },
  { start: 631701, end: 631799, state: 'TN', rto: '24' },
  
  // Tirupattur - TN-99 (New district)
  { start: 635601, end: 635699, state: 'TN', rto: '99' },
  
  // CUDDALORE & VILLUPURAM REGION
  // Villupuram - TN-25
  { start: 604001, end: 604499, state: 'TN', rto: '25' },
  { start: 605601, end: 605999, state: 'TN', rto: '25' },
  
  // Cuddalore - TN-26
  { start: 607001, end: 608999, state: 'TN', rto: '26' },
  
  // Kallakurichi - TN-98 (New district)
  { start: 606201, end: 606299, state: 'TN', rto: '98' },
  
  // DELTA REGION
  // Nagapattinam - TN-27
  { start: 609001, end: 609999, state: 'TN', rto: '27' },
  { start: 611001, end: 611999, state: 'TN', rto: '27' },
  
  // Thanjavur - TN-28
  { start: 612001, end: 614999, state: 'TN', rto: '28' },
  
  // Tiruvarur - TN-29
  { start: 610001, end: 610999, state: 'TN', rto: '29' },
  
  // Mayiladuthurai - TN-97 (New district)
  { start: 609001, end: 609199, state: 'TN', rto: '97' },
  
  // SALEM REGION
  // Salem - TN-30
  { start: 636001, end: 636999, state: 'TN', rto: '30' },
  
  // Dharmapuri - TN-31
  { start: 635001, end: 635599, state: 'TN', rto: '31' },
  
  // Krishnagiri - TN-32
  { start: 635101, end: 635399, state: 'TN', rto: '32' },
  
  // ERODE REGION
  // Erode - TN-33
  { start: 638001, end: 638999, state: 'TN', rto: '33' },
  
  // Namakkal - TN-34
  { start: 637001, end: 637999, state: 'TN', rto: '34' },
  
  // COIMBATORE REGION
  // Nilgiris (Ooty) - TN-36
  { start: 643001, end: 643299, state: 'TN', rto: '36' },
  
  // Coimbatore - TN-37
  { start: 641001, end: 641049, state: 'TN', rto: '37' },
  { start: 641101, end: 641199, state: 'TN', rto: '37' },
  { start: 641301, end: 641399, state: 'TN', rto: '37' },
  { start: 641401, end: 641499, state: 'TN', rto: '37' },
  
  // Coimbatore South - TN-38
  { start: 641050, end: 641099, state: 'TN', rto: '38' },
  
  // Tiruppur - TN-39
  { start: 641601, end: 641699, state: 'TN', rto: '39' },
  { start: 642001, end: 642999, state: 'TN', rto: '39' },
  
  // Pollachi - TN-40
  { start: 642001, end: 642199, state: 'TN', rto: '40' },
  
  // Mettupalayam - TN-41
  { start: 641301, end: 641399, state: 'TN', rto: '41' },
  
  // TRICHY REGION
  // Trichy (Tiruchirappalli) - TN-45
  { start: 620001, end: 620999, state: 'TN', rto: '45' },
  { start: 621001, end: 621199, state: 'TN', rto: '45' },
  
  // Karur - TN-46
  { start: 639001, end: 639999, state: 'TN', rto: '46' },
  
  // Perambalur - TN-47
  { start: 621201, end: 621699, state: 'TN', rto: '47' },
  
  // Ariyalur - TN-48
  { start: 621701, end: 621999, state: 'TN', rto: '48' },
  
  // Pudukkottai - TN-49
  { start: 622001, end: 622999, state: 'TN', rto: '49' },
  
  // MADURAI REGION
  // Dindigul - TN-57
  { start: 624001, end: 624999, state: 'TN', rto: '57' },
  
  // Sivaganga - TN-58
  { start: 630001, end: 630999, state: 'TN', rto: '58' },
  
  // Madurai - TN-59
  { start: 625001, end: 625099, state: 'TN', rto: '59' },
  { start: 625101, end: 625299, state: 'TN', rto: '59' },
  { start: 625501, end: 625599, state: 'TN', rto: '59' },
  
  // Theni - TN-60
  { start: 625301, end: 625499, state: 'TN', rto: '60' },
  { start: 625601, end: 625999, state: 'TN', rto: '60' },
  
  // Madurai South - TN-64
  { start: 625001, end: 625099, state: 'TN', rto: '64' },
  
  // SOUTHERN REGION
  // Virudhunagar - TN-67
  { start: 626001, end: 626999, state: 'TN', rto: '67' },
  
  // Ramanathapuram - TN-68
  { start: 623001, end: 623999, state: 'TN', rto: '68' },
  
  // Thoothukudi (Tuticorin) - TN-69
  { start: 628001, end: 628999, state: 'TN', rto: '69' },
  
  // Tirunelveli - TN-72
  { start: 627001, end: 627099, state: 'TN', rto: '72' },
  { start: 627101, end: 627199, state: 'TN', rto: '72' },
  { start: 627201, end: 627299, state: 'TN', rto: '72' },
  { start: 627301, end: 627399, state: 'TN', rto: '72' },
  { start: 627401, end: 627499, state: 'TN', rto: '72' },
  { start: 627501, end: 627599, state: 'TN', rto: '72' },
  { start: 627601, end: 627699, state: 'TN', rto: '72' },
  { start: 627701, end: 627799, state: 'TN', rto: '72' },
  { start: 627951, end: 627999, state: 'TN', rto: '72' },
  
  // Tenkasi - TN-73
  { start: 627801, end: 627899, state: 'TN', rto: '73' },
  { start: 627901, end: 627950, state: 'TN', rto: '73' },
  
  // Kanyakumari - TN-74
  { start: 629001, end: 629999, state: 'TN', rto: '74' },
  
  // Nagercoil - TN-75
  { start: 629001, end: 629199, state: 'TN', rto: '75' },
  
  // ADDITIONAL TAMIL NADU CATCH-ALL RANGES
  // These ensure any TN pincode not specifically mapped still gets a reasonable RTO
  // Chennai general (600xxx)
  { start: 600001, end: 600999, state: 'TN', rto: '01' },
  // Tiruvallur/Kancheepuram area (601xxx-603xxx)
  { start: 601001, end: 603999, state: 'TN', rto: '15' },
  // Villupuram area (604xxx-605xxx)
  { start: 604001, end: 605999, state: 'TN', rto: '25' },
  // Tiruvannamalai area (606xxx)
  { start: 606001, end: 606999, state: 'TN', rto: '24' },
  // Cuddalore area (607xxx-608xxx)
  { start: 607001, end: 608999, state: 'TN', rto: '26' },
  // Nagapattinam area (609xxx)
  { start: 609001, end: 609999, state: 'TN', rto: '27' },
  // Tiruvarur area (610xxx)
  { start: 610001, end: 610999, state: 'TN', rto: '29' },
  // Nagapattinam area (611xxx)
  { start: 611001, end: 611999, state: 'TN', rto: '27' },
  // Thanjavur area (612xxx-614xxx)
  { start: 612001, end: 614999, state: 'TN', rto: '28' },
  // Trichy area (620xxx-621xxx)
  { start: 620001, end: 621999, state: 'TN', rto: '45' },
  // Pudukkottai area (622xxx)
  { start: 622001, end: 622999, state: 'TN', rto: '49' },
  // Ramanathapuram area (623xxx)
  { start: 623001, end: 623999, state: 'TN', rto: '68' },
  // Dindigul area (624xxx)
  { start: 624001, end: 624999, state: 'TN', rto: '57' },
  // Madurai area (625xxx)
  { start: 625001, end: 625999, state: 'TN', rto: '59' },
  // Virudhunagar area (626xxx)
  { start: 626001, end: 626999, state: 'TN', rto: '67' },
  // Tirunelveli area (627xxx)
  { start: 627001, end: 627999, state: 'TN', rto: '72' },
  // Thoothukudi area (628xxx)
  { start: 628001, end: 628999, state: 'TN', rto: '69' },
  // Kanyakumari area (629xxx)
  { start: 629001, end: 629999, state: 'TN', rto: '74' },
  // Sivaganga area (630xxx)
  { start: 630001, end: 630999, state: 'TN', rto: '58' },
  // Tiruvallur/Vellore area (631xxx-632xxx)
  { start: 631001, end: 631999, state: 'TN', rto: '15' },
  { start: 632001, end: 632999, state: 'TN', rto: '23' },
  // Vellore area (633xxx-634xxx)
  { start: 633001, end: 634999, state: 'TN', rto: '23' },
  // Dharmapuri/Krishnagiri area (635xxx)
  { start: 635001, end: 635999, state: 'TN', rto: '31' },
  // Salem area (636xxx)
  { start: 636001, end: 636999, state: 'TN', rto: '30' },
  // Namakkal area (637xxx)
  { start: 637001, end: 637999, state: 'TN', rto: '34' },
  // Erode area (638xxx)
  { start: 638001, end: 638999, state: 'TN', rto: '33' },
  // Karur area (639xxx)
  { start: 639001, end: 639999, state: 'TN', rto: '46' },
  // Coimbatore area (641xxx)
  { start: 641001, end: 641999, state: 'TN', rto: '37' },
  // Tiruppur area (642xxx)
  { start: 642001, end: 642999, state: 'TN', rto: '39' },
  // Nilgiris area (643xxx)
  { start: 643001, end: 643999, state: 'TN', rto: '36' },
  
  // Karnataka (KA)
  { start: 560001, end: 560999, state: 'KA', rto: '01' }, // Bangalore
  { start: 570001, end: 570999, state: 'KA', rto: '09' }, // Mysore
  { start: 580001, end: 580999, state: 'KA', rto: '25' }, // Hubli-Dharwad
  { start: 590001, end: 590999, state: 'KA', rto: '22' }, // Belgaum
  
  // Kerala (KL)
  { start: 670001, end: 670999, state: 'KL', rto: '01' }, // Kannur
  { start: 673001, end: 673999, state: 'KL', rto: '11' }, // Kozhikode
  { start: 680001, end: 680999, state: 'KL', rto: '07' }, // Thrissur
  { start: 682001, end: 682999, state: 'KL', rto: '07' }, // Ernakulam
  { start: 685001, end: 685999, state: 'KL', rto: '06' }, // Idukki
  { start: 689001, end: 689999, state: 'KL', rto: '01' }, // Pathanamthitta
  { start: 690001, end: 690999, state: 'KL', rto: '02' }, // Kollam
  { start: 695001, end: 695999, state: 'KL', rto: '01' }, // Thiruvananthapuram
  
  // Andhra Pradesh (AP)
  { start: 500001, end: 500999, state: 'TS', rto: '01' }, // Hyderabad (Telangana)
  { start: 520001, end: 520999, state: 'AP', rto: '09' }, // Vijayawada
  { start: 530001, end: 530999, state: 'AP', rto: '21' }, // Visakhapatnam
  { start: 515001, end: 515999, state: 'AP', rto: '02' }, // Anantapur
  { start: 516001, end: 516999, state: 'AP', rto: '04' }, // Kadapa
  { start: 517001, end: 517999, state: 'AP', rto: '12' }, // Tirupati
  { start: 518001, end: 518999, state: 'AP', rto: '08' }, // Kurnool
  { start: 522001, end: 522999, state: 'AP', rto: '07' }, // Guntur
  { start: 523001, end: 523999, state: 'AP', rto: '16' }, // Ongole
  { start: 524001, end: 524999, state: 'AP', rto: '14' }, // Nellore
  
  // Telangana (TS)
  { start: 500001, end: 509999, state: 'TS', rto: '01' }, // Hyderabad
  { start: 501001, end: 501999, state: 'TS', rto: '02' }, // Medchal
  { start: 502001, end: 502999, state: 'TS', rto: '03' }, // Sangareddy
  { start: 503001, end: 503999, state: 'TS', rto: '16' }, // Nizamabad
  { start: 504001, end: 504999, state: 'TS', rto: '01' }, // Adilabad
  { start: 505001, end: 505999, state: 'TS', rto: '06' }, // Karimnagar
  { start: 506001, end: 506999, state: 'TS', rto: '11' }, // Warangal
  
  // Maharashtra (MH)
  { start: 400001, end: 400999, state: 'MH', rto: '01' }, // Mumbai
  { start: 410001, end: 410999, state: 'MH', rto: '12' }, // Pune
  { start: 411001, end: 411999, state: 'MH', rto: '12' }, // Pune
  { start: 440001, end: 440999, state: 'MH', rto: '31' }, // Nagpur
  { start: 422001, end: 422999, state: 'MH', rto: '15' }, // Nashik
  { start: 431001, end: 431999, state: 'MH', rto: '20' }, // Aurangabad
  
  // Gujarat (GJ)
  { start: 380001, end: 380999, state: 'GJ', rto: '01' }, // Ahmedabad
  { start: 390001, end: 390999, state: 'GJ', rto: '06' }, // Vadodara
  { start: 395001, end: 395999, state: 'GJ', rto: '05' }, // Surat
  { start: 360001, end: 360999, state: 'GJ', rto: '11' }, // Rajkot
  
  // Delhi (DL)
  { start: 110001, end: 110999, state: 'DL', rto: '01' },
  
  // Uttar Pradesh (UP)
  { start: 201001, end: 201999, state: 'UP', rto: '14' }, // Ghaziabad
  { start: 208001, end: 208999, state: 'UP', rto: '65' }, // Kanpur
  { start: 226001, end: 226999, state: 'UP', rto: '32' }, // Lucknow
  { start: 221001, end: 221999, state: 'UP', rto: '65' }, // Varanasi
  { start: 250001, end: 250999, state: 'UP', rto: '07' }, // Meerut
  { start: 282001, end: 282999, state: 'UP', rto: '20' }, // Agra
  
  // Rajasthan (RJ)
  { start: 302001, end: 302999, state: 'RJ', rto: '14' }, // Jaipur
  { start: 342001, end: 342999, state: 'RJ', rto: '19' }, // Jodhpur
  { start: 313001, end: 313999, state: 'RJ', rto: '27' }, // Udaipur
  { start: 324001, end: 324999, state: 'RJ', rto: '21' }, // Kota
  
  // West Bengal (WB)
  { start: 700001, end: 700999, state: 'WB', rto: '01' }, // Kolkata
  { start: 711001, end: 711999, state: 'WB', rto: '02' }, // Howrah
  
  // Punjab (PB)
  { start: 140001, end: 140999, state: 'PB', rto: '65' }, // Ludhiana
  { start: 143001, end: 143999, state: 'PB', rto: '02' }, // Amritsar
  { start: 160001, end: 160999, state: 'PB', rto: '65' }, // Chandigarh (shared)
  
  // Haryana (HR)
  { start: 121001, end: 121999, state: 'HR', rto: '26' }, // Faridabad
  { start: 122001, end: 122999, state: 'HR', rto: '26' }, // Gurgaon
  { start: 125001, end: 125999, state: 'HR', rto: '18' }, // Hisar
  
  // Madhya Pradesh (MP)
  { start: 452001, end: 452999, state: 'MP', rto: '09' }, // Indore
  { start: 462001, end: 462999, state: 'MP', rto: '04' }, // Bhopal
  { start: 482001, end: 482999, state: 'MP', rto: '20' }, // Jabalpur
  
  // Bihar (BR)
  { start: 800001, end: 800999, state: 'BR', rto: '01' }, // Patna
  { start: 842001, end: 842999, state: 'BR', rto: '21' }, // Muzaffarpur
  
  // Odisha (OD)
  { start: 751001, end: 751999, state: 'OD', rto: '02' }, // Bhubaneswar
  { start: 753001, end: 753999, state: 'OD', rto: '05' }, // Cuttack
  
  // Jharkhand (JH)
  { start: 834001, end: 834999, state: 'JH', rto: '01' }, // Ranchi
  { start: 831001, end: 831999, state: 'JH', rto: '05' }, // Jamshedpur
  
  // Chhattisgarh (CG)
  { start: 492001, end: 492999, state: 'CG', rto: '04' }, // Raipur
  { start: 490001, end: 490999, state: 'CG', rto: '07' }, // Durg-Bhilai
  
  // Assam (AS)
  { start: 781001, end: 781999, state: 'AS', rto: '01' }, // Guwahati
  
  // Goa (GA)
  { start: 403001, end: 403999, state: 'GA', rto: '01' }, // Panaji
  
  // Himachal Pradesh (HP)
  { start: 171001, end: 171999, state: 'HP', rto: '01' }, // Shimla
  
  // Uttarakhand (UK)
  { start: 248001, end: 248999, state: 'UK', rto: '07' }, // Dehradun
  
  // Puducherry (PY)
  { start: 605001, end: 605999, state: 'PY', rto: '01' },
]

/**
 * Get state code and RTO number from pincode
 */
export function getStateAndRTOFromPincode(pincode: string): { state: string; rto: string } {
  const normalizedPincode = parseInt(pincode.replace(/\D/g, '').padStart(6, '0').slice(0, 6), 10)
  
  // Find matching range
  for (const range of PINCODE_RANGES) {
    if (normalizedPincode >= range.start && normalizedPincode <= range.end) {
      return { state: range.state, rto: range.rto.padStart(2, '0') }
    }
  }
  
  // Default to Tamil Nadu, Coimbatore if no match found
  return { state: 'TN', rto: '37' }
}

/**
 * Get RTO number from pincode (legacy function for compatibility)
 */
export function getRTOFromPincode(pincode: string): string {
  return getStateAndRTOFromPincode(pincode).rto
}

/**
 * Map category and brand to category code
 */
export function getCategoryCode(category: string, brand?: string): string {
  const normalizedCategory = category.toLowerCase()
  const normalizedBrand = brand?.toLowerCase() || ''

  // Camera/DSLR
  if (normalizedCategory === 'cameras' || normalizedCategory === 'camera' || normalizedCategory === 'dslr') {
    return 'DSLR'
  }

  // Apple Phones (iPhone)
  if ((normalizedCategory === 'phones' || normalizedCategory === 'phone') && 
      (normalizedBrand.includes('apple') || normalizedBrand.includes('iphone'))) {
    return 'IPNE'
  }

  // Samsung Phones
  if ((normalizedCategory === 'phones' || normalizedCategory === 'phone') && normalizedBrand.includes('samsung')) {
    return 'SMSG'
  }

  // Apple Laptop (MacBook)
  if ((normalizedCategory === 'laptops' || normalizedCategory === 'laptop') && 
      (normalizedBrand.includes('apple') || normalizedBrand.includes('macbook'))) {
    return 'MCBK'
  }

  // Apple Tablet (iPad)
  if ((normalizedCategory === 'tablets' || normalizedCategory === 'tablet') && 
      (normalizedBrand.includes('apple') || normalizedBrand.includes('ipad'))) {
    return 'IPAD'
  }

  // Default fallback based on category
  if (normalizedCategory === 'phones' || normalizedCategory === 'phone') {
    return 'PHNE' // Generic phone
  }
  if (normalizedCategory === 'laptops' || normalizedCategory === 'laptop') {
    return 'LPTP' // Generic laptop
  }
  if (normalizedCategory === 'tablets' || normalizedCategory === 'tablet') {
    return 'TBLT' // Generic tablet
  }

  return 'DSLR' // Default fallback for cameras
}

/**
 * Get state code from state name
 */
export function getStateCode(state: string): string {
  const normalizedState = state.toLowerCase().trim()
  
  const stateMap: Record<string, string> = {
    'tamil nadu': 'TN',
    'tamilnadu': 'TN',
    'tn': 'TN',
    'karnataka': 'KA',
    'kerala': 'KL',
    'andhra pradesh': 'AP',
    'telangana': 'TS',
    'maharashtra': 'MH',
    'delhi': 'DL',
    'new delhi': 'DL',
    'gujarat': 'GJ',
    'rajasthan': 'RJ',
    'west bengal': 'WB',
    'uttar pradesh': 'UP',
    'punjab': 'PB',
    'haryana': 'HR',
    'odisha': 'OD',
    'orissa': 'OD',
    'assam': 'AS',
    'bihar': 'BR',
    'jharkhand': 'JH',
    'chhattisgarh': 'CG',
    'madhya pradesh': 'MP',
    'himachal pradesh': 'HP',
    'uttarakhand': 'UK',
    'goa': 'GA',
    'manipur': 'MN',
    'meghalaya': 'MG',
    'mizoram': 'MZ',
    'nagaland': 'NL',
    'sikkim': 'SK',
    'tripura': 'TR',
    'arunachal pradesh': 'AR',
    'ladakh': 'LA',
    'jammu and kashmir': 'JK',
    'jammu & kashmir': 'JK',
    'puducherry': 'PY',
    'pondicherry': 'PY',
    'andaman and nicobar islands': 'AN',
    'andaman & nicobar': 'AN',
    'dadra and nagar haveli and daman and diu': 'DH',
    'daman and diu': 'DD',
    'lakshadweep': 'LD',
    'chandigarh': 'CH',
  }

  return stateMap[normalizedState] || 'TN' // Default to Tamil Nadu
}

/**
 * Get next sequential order number (atomic increment)
 * This ensures ALL orders get sequential numbers: 1001, 1002, 1003, etc.
 * Uses Firestore transactions for atomic counter increment to prevent race conditions.
 */
async function getNextOrderNumber(): Promise<number> {
  const db = getFirestoreServer()
  const counterRef = doc(db, 'counters', 'orderId')

  console.log('Starting getNextOrderNumber - using atomic transaction...')
  
  // Retry logic for transaction conflicts
  const maxRetries = 5
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Transaction attempt ${attempt + 1}/${maxRetries}`)
      
      // Use transaction to ensure atomic read-modify-write
      // This prevents race conditions where two concurrent requests get the same number
      const nextNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef)
        console.log('Counter document exists:', counterDoc.exists())
        
        let newNumber: number
        
        if (counterDoc.exists()) {
          const data = counterDoc.data()
          const currentNumber = typeof data?.count === 'number' ? data.count : 1000
          console.log('Current counter value:', currentNumber)
          
          // Validate the current number
          if (isNaN(currentNumber) || currentNumber < 1000) {
            console.warn('Invalid counter value, resetting to 1000')
            newNumber = 1001
          } else {
            newNumber = currentNumber + 1
          }
          
          // Use update within transaction to ensure atomicity
          transaction.update(counterRef, { 
            count: newNumber,
            lastUpdated: new Date().toISOString()
          })
          console.log('Incremented to:', newNumber)
        } else {
          // Initialize counter if it doesn't exist
          console.log('Initializing counter to 1001')
          newNumber = 1001
          transaction.set(counterRef, { 
            count: newNumber,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          })
        }
        
        return newNumber
      })
      
      console.log('Transaction successful, order number:', nextNumber)
      return nextNumber
      
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; stack?: string }
      lastError = error instanceof Error ? error : new Error(String(error))
      
      console.error(`Transaction error (attempt ${attempt + 1}/${maxRetries}):`, {
        message: err?.message,
        code: err?.code,
      })
      
      // For permission errors, don't retry
      if (err?.code === 'permission-denied') {
        console.error('Permission denied - check Firestore security rules')
        throw new Error('Permission denied: Check Firestore security rules for counters collection')
      }
      
      // If it's a transaction conflict or temporary error, retry with exponential backoff
      if (
        err?.code === 'failed-precondition' || 
        err?.code === 'aborted' || 
        err?.code === 'unavailable' ||
        err?.code === 'resource-exhausted' ||
        err?.message?.includes('transaction') ||
        err?.message?.includes('contention')
      ) {
        // Add jitter to prevent thundering herd
        const baseWait = Math.pow(2, attempt) * 50
        const jitter = Math.random() * 50
        const waitTime = baseWait + jitter
        console.log(`Transaction conflict, retrying after ${Math.round(waitTime)}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      
      // For other errors, still retry but with longer wait
      const waitTime = Math.pow(2, attempt) * 100
      console.log(`Unexpected error, retrying after ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // All retries failed
  const errorMessage = `Failed to get sequential order number after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
  console.error(errorMessage)
  throw new Error(errorMessage)
}

/**
 * Generate custom Order ID
 * 
 * @param pincode - 6-digit pincode (used to determine state and RTO)
 * @param category - Product category (cameras, phones, laptops, tablets)
 * @param brand - Product brand (optional, used for category code determination)
 * @param state - State name (optional, will be derived from pincode if not provided)
 * @returns Generated Order ID (e.g., "TN37WTDSLR1001")
 */
export async function generateOrderId(
  pincode: string,
  category: string,
  brand?: string,
  state?: string
): Promise<string> {
  try {
    // Get state and RTO from pincode
    const { state: derivedState, rto: rtoNumber } = getStateAndRTOFromPincode(pincode)
    
    // Use provided state code or derive from pincode
    const stateCode = state ? getStateCode(state) : derivedState
    
    const categoryCode = getCategoryCode(category, brand)
    
    console.log('Generating Order ID components:', { 
      stateCode, 
      rtoNumber, 
      categoryCode, 
      category, 
      brand,
      pincode 
    })
    
    const orderNumber = await getNextOrderNumber()
    console.log('Got order number:', orderNumber)

    // Format: {STATE}{RTO}{WT}{CATEGORY}{SEQUENCE}
    // Example: TN37WTDSLR1001
    const orderId = `${stateCode}${rtoNumber}WT${categoryCode}${orderNumber.toString().padStart(4, '0')}`
    console.log('Generated Order ID:', orderId)
    
    return orderId
  } catch (error: any) {
    console.error('Error in generateOrderId:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      pincode,
      category,
      brand,
      state,
    })
    throw error
  }
}

/**
 * Generate Order ID for client-side use (without sequential number)
 * This is useful for displaying a preview before the actual order is created
 */
export function generateOrderIdPreview(
  pincode: string,
  category: string,
  brand?: string
): string {
  const { state: stateCode, rto: rtoNumber } = getStateAndRTOFromPincode(pincode)
  const categoryCode = getCategoryCode(category, brand)
  
  // Return preview with placeholder for sequence number
  return `${stateCode}${rtoNumber}WT${categoryCode}XXXX`
}
