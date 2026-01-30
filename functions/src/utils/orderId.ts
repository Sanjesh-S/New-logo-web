/**
 * Order ID Generator Utility for Firebase Functions
 * 
 * Format: {STATE}{RTO}{WT}{CATEGORY}{SEQUENCE}
 * Example: TN37WTDSLR1001
 */

import * as admin from 'firebase-admin'

/**
 * Pincode ranges to State and RTO mapping
 */
interface PincodeRange {
  start: number
  end: number
  state: string
  rto: string
}

// Comprehensive pincode to state and RTO mapping
// Tamil Nadu RTO codes: Official RTO codes for all 38 districts
const PINCODE_RANGES: PincodeRange[] = [
  // ============================================
  // TAMIL NADU (TN) - ALL DISTRICTS COMPLETE
  // ============================================
  
  // CHENNAI REGION (TN-01 to TN-22)
  { start: 600001, end: 600012, state: 'TN', rto: '01' }, // Chennai North
  { start: 600021, end: 600021, state: 'TN', rto: '01' },
  { start: 600039, end: 600039, state: 'TN', rto: '01' },
  { start: 600081, end: 600081, state: 'TN', rto: '01' },
  { start: 600108, end: 600108, state: 'TN', rto: '01' },
  
  { start: 600013, end: 600020, state: 'TN', rto: '02' }, // Chennai South
  { start: 600022, end: 600032, state: 'TN', rto: '02' },
  { start: 600041, end: 600042, state: 'TN', rto: '02' },
  { start: 600083, end: 600083, state: 'TN', rto: '02' },
  { start: 600088, end: 600088, state: 'TN', rto: '02' },
  { start: 600090, end: 600091, state: 'TN', rto: '02' },
  { start: 600093, end: 600093, state: 'TN', rto: '02' },
  { start: 600096, end: 600097, state: 'TN', rto: '02' },
  { start: 600113, end: 600113, state: 'TN', rto: '02' },
  { start: 600119, end: 600119, state: 'TN', rto: '02' },
  
  { start: 600053, end: 600058, state: 'TN', rto: '03' }, // Chennai West
  { start: 600062, end: 600062, state: 'TN', rto: '03' },
  { start: 600077, end: 600077, state: 'TN', rto: '03' },
  { start: 600095, end: 600095, state: 'TN', rto: '03' },
  { start: 600098, end: 600098, state: 'TN', rto: '03' },
  { start: 600101, end: 600101, state: 'TN', rto: '03' },
  { start: 600106, end: 600107, state: 'TN', rto: '03' },
  { start: 600110, end: 600110, state: 'TN', rto: '03' },
  { start: 600116, end: 600118, state: 'TN', rto: '03' },
  
  { start: 600004, end: 600005, state: 'TN', rto: '04' }, // Chennai East
  { start: 600033, end: 600038, state: 'TN', rto: '04' },
  { start: 600040, end: 600040, state: 'TN', rto: '04' },
  { start: 600086, end: 600086, state: 'TN', rto: '04' },
  
  { start: 600003, end: 600003, state: 'TN', rto: '05' }, // Chennai Central
  { start: 600008, end: 600009, state: 'TN', rto: '05' },
  
  { start: 600043, end: 600048, state: 'TN', rto: '09' }, // Tambaram
  { start: 600063, end: 600064, state: 'TN', rto: '09' },
  { start: 600069, end: 600069, state: 'TN', rto: '09' },
  { start: 600073, end: 600073, state: 'TN', rto: '09' },
  { start: 600100, end: 600100, state: 'TN', rto: '09' },
  { start: 600122, end: 600127, state: 'TN', rto: '09' },
  
  { start: 600051, end: 600052, state: 'TN', rto: '12' }, // Madhavaram
  { start: 600060, end: 600060, state: 'TN', rto: '12' },
  { start: 600066, end: 600067, state: 'TN', rto: '12' },
  
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
  
  // Vellore - TN-23
  { start: 632001, end: 632399, state: 'TN', rto: '23' },
  { start: 632501, end: 632999, state: 'TN', rto: '23' },
  
  // Tiruvannamalai - TN-24
  { start: 604501, end: 604999, state: 'TN', rto: '24' },
  { start: 606001, end: 606999, state: 'TN', rto: '24' },
  { start: 631701, end: 631799, state: 'TN', rto: '24' },
  
  // Tirupattur - TN-99
  { start: 635601, end: 635699, state: 'TN', rto: '99' },
  
  // Villupuram - TN-25
  { start: 604001, end: 604499, state: 'TN', rto: '25' },
  { start: 605601, end: 605999, state: 'TN', rto: '25' },
  
  // Cuddalore - TN-26
  { start: 607001, end: 608999, state: 'TN', rto: '26' },
  
  // Kallakurichi - TN-98
  { start: 606201, end: 606299, state: 'TN', rto: '98' },
  
  // Nagapattinam - TN-27
  { start: 609001, end: 609999, state: 'TN', rto: '27' },
  { start: 611001, end: 611999, state: 'TN', rto: '27' },
  
  // Thanjavur - TN-28
  { start: 612001, end: 614999, state: 'TN', rto: '28' },
  
  // Tiruvarur - TN-29
  { start: 610001, end: 610999, state: 'TN', rto: '29' },
  
  // Mayiladuthurai - TN-97
  { start: 609001, end: 609199, state: 'TN', rto: '97' },
  
  // Salem - TN-30
  { start: 636001, end: 636999, state: 'TN', rto: '30' },
  
  // Dharmapuri - TN-31
  { start: 635001, end: 635599, state: 'TN', rto: '31' },
  
  // Krishnagiri - TN-32
  { start: 635101, end: 635399, state: 'TN', rto: '32' },
  
  // Erode - TN-33
  { start: 638001, end: 638999, state: 'TN', rto: '33' },
  
  // Namakkal - TN-34
  { start: 637001, end: 637999, state: 'TN', rto: '34' },
  
  // Nilgiris - TN-36
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
  
  // Trichy - TN-45
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
  
  // Virudhunagar - TN-67
  { start: 626001, end: 626999, state: 'TN', rto: '67' },
  
  // Ramanathapuram - TN-68
  { start: 623001, end: 623999, state: 'TN', rto: '68' },
  
  // Thoothukudi - TN-69
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
  
  // CATCH-ALL RANGES FOR TN
  { start: 600001, end: 600999, state: 'TN', rto: '01' }, // Chennai
  { start: 601001, end: 603999, state: 'TN', rto: '15' }, // Tiruvallur
  { start: 604001, end: 605999, state: 'TN', rto: '25' }, // Villupuram
  { start: 606001, end: 606999, state: 'TN', rto: '24' }, // Tiruvannamalai
  { start: 607001, end: 608999, state: 'TN', rto: '26' }, // Cuddalore
  { start: 609001, end: 609999, state: 'TN', rto: '27' }, // Nagapattinam
  { start: 610001, end: 610999, state: 'TN', rto: '29' }, // Tiruvarur
  { start: 611001, end: 611999, state: 'TN', rto: '27' }, // Nagapattinam
  { start: 612001, end: 614999, state: 'TN', rto: '28' }, // Thanjavur
  { start: 620001, end: 621999, state: 'TN', rto: '45' }, // Trichy
  { start: 622001, end: 622999, state: 'TN', rto: '49' }, // Pudukkottai
  { start: 623001, end: 623999, state: 'TN', rto: '68' }, // Ramanathapuram
  { start: 624001, end: 624999, state: 'TN', rto: '57' }, // Dindigul
  { start: 625001, end: 625999, state: 'TN', rto: '59' }, // Madurai
  { start: 626001, end: 626999, state: 'TN', rto: '67' }, // Virudhunagar
  { start: 627001, end: 627999, state: 'TN', rto: '72' }, // Tirunelveli
  { start: 628001, end: 628999, state: 'TN', rto: '69' }, // Thoothukudi
  { start: 629001, end: 629999, state: 'TN', rto: '74' }, // Kanyakumari
  { start: 630001, end: 630999, state: 'TN', rto: '58' }, // Sivaganga
  { start: 631001, end: 631999, state: 'TN', rto: '15' }, // Tiruvallur
  { start: 632001, end: 632999, state: 'TN', rto: '23' }, // Vellore
  { start: 633001, end: 634999, state: 'TN', rto: '23' }, // Vellore
  { start: 635001, end: 635999, state: 'TN', rto: '31' }, // Dharmapuri
  { start: 636001, end: 636999, state: 'TN', rto: '30' }, // Salem
  { start: 637001, end: 637999, state: 'TN', rto: '34' }, // Namakkal
  { start: 638001, end: 638999, state: 'TN', rto: '33' }, // Erode
  { start: 639001, end: 639999, state: 'TN', rto: '46' }, // Karur
  { start: 641001, end: 641999, state: 'TN', rto: '37' }, // Coimbatore
  { start: 642001, end: 642999, state: 'TN', rto: '39' }, // Tiruppur
  { start: 643001, end: 643999, state: 'TN', rto: '36' }, // Nilgiris
  
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
  { start: 160001, end: 160999, state: 'PB', rto: '65' }, // Chandigarh
  
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
  
  for (const range of PINCODE_RANGES) {
    if (normalizedPincode >= range.start && normalizedPincode <= range.end) {
      return { state: range.state, rto: range.rto.padStart(2, '0') }
    }
  }
  
  return { state: 'TN', rto: '37' } // Default to Tamil Nadu, Coimbatore
}

export function getRTOFromPincode(pincode: string): string {
  return getStateAndRTOFromPincode(pincode).rto
}

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
    return 'PHNE'
  }
  if (normalizedCategory === 'laptops' || normalizedCategory === 'laptop') {
    return 'LPTP'
  }
  if (normalizedCategory === 'tablets' || normalizedCategory === 'tablet') {
    return 'TBLT'
  }
  
  return 'DSLR' // Default fallback for cameras
}

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
  return stateMap[normalizedState] || 'TN'
}

async function getNextOrderNumber(db: admin.firestore.Firestore): Promise<number> {
  const counterRef = db.collection('counters').doc('orderId')

  const maxRetries = 5
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef)
        
        let currentNumber = 1000
        
        if (counterDoc.exists) {
          const data = counterDoc.data()
          currentNumber = data?.count || 1000
        } else {
          transaction.set(counterRef, { count: 1000 })
        }

        const nextNumber = currentNumber + 1
        transaction.update(counterRef, { count: nextNumber })

        return nextNumber
      })
    } catch (error: any) {
      lastError = error
      if (error.code === 'failed-precondition' || error.message?.includes('transaction')) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10))
        continue
      }
      console.error(`Error getting next order number (attempt ${attempt + 1}/${maxRetries}):`, error)
    }
  }

  // Fallback
  try {
    const counterDoc = await counterRef.get()
    let currentNumber = 1000
    
    if (counterDoc.exists) {
      const data = counterDoc.data()
      currentNumber = data?.count || 1000
    } else {
      await counterRef.set({ count: 1000 })
      currentNumber = 1000
    }

    const nextNumber = currentNumber + 1
    await counterRef.set({ count: nextNumber })
    return nextNumber
  } catch (fallbackError) {
    console.error('Fallback counter update failed:', fallbackError)
    throw new Error(`Failed to get sequential order number after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`)
  }
}

export async function generateOrderId(
  db: admin.firestore.Firestore,
  pincode: string,
  category: string,
  brand?: string,
  state?: string
): Promise<string> {
  // Get state and RTO from pincode
  const { state: derivedState, rto: rtoNumber } = getStateAndRTOFromPincode(pincode)
  
  // Use provided state code or derive from pincode
  const stateCode = state ? getStateCode(state) : derivedState
  
  const categoryCode = getCategoryCode(category, brand)
  const orderNumber = await getNextOrderNumber(db)

  return `${stateCode}${rtoNumber}WT${categoryCode}${orderNumber.toString().padStart(4, '0')}`
}
