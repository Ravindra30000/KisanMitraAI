import os
import logging
import re
from typing import List, Dict, Any

logger = logging.getLogger("kisanmitra-rag")

# Path to persist the Chroma database
CHROMA_PERSIST_PATH = os.getenv("CHROMA_PERSIST_PATH", "./chroma_db")

# Initialize Chroma client and embedding model
_client = None
_collection = None
_model = None


def get_rag_model():
    """Lazy load sentence transformer model to save memory during simple imports."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading paraphrase-multilingual-MiniLM-L12-v2 model for RAG...")
        try:
            _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            logger.info("RAG embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise e
    return _model


def get_chroma_collection():
    """Get or create the ChromaDB collection for natural farming."""
    global _client, _collection
    if _collection is None:
        import chromadb
        logger.info(f"Initializing ChromaDB client at {CHROMA_PERSIST_PATH}...")
        try:
            # Persistent client in ChromaDB >= 0.4.0
            _client = chromadb.PersistentClient(path=CHROMA_PERSIST_PATH)
            _collection = _client.get_or_create_collection(
                name="natural_farming_kb",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB collection loaded/created successfully.")
            
            # Ingest default data if the collection is empty, or sync missing ones
            count = _collection.count()
            if count == 0:
                logger.info("RAG collection is empty. Starting auto-ingestion...")
                ingest_initial_knowledge()
            else:
                try:
                    existing = _collection.get(include=[])
                    existing_ids = set(existing.get("ids", []))
                    missing_docs = [doc for doc in NATURAL_FARMING_DOCS if doc["id"] not in existing_ids]
                    if missing_docs:
                        logger.info(f"RAG database has {count} entries, but is missing {len(missing_docs)} documents. Syncing missing ones...")
                        ingest_initial_knowledge(missing_docs)
                except Exception as ex:
                    logger.error(f"Failed to check missing documents in ChromaDB: {ex}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB collection: {e}")
            # Fallback to ephemeral client so backend doesn't crash
            try:
                _client = chromadb.EphemeralClient()
                _collection = _client.get_or_create_collection(name="natural_farming_kb")
                logger.warning("Fell back to Ephemeral ChromaDB Client.")
                ingest_initial_knowledge()
            except Exception as ex:
                logger.critical(f"Critical failure in ChromaDB initialization: {ex}")
    return _collection


# ---------------------------------------------------------------------------
# NATURAL FARMING KNOWLEDGE BASE
# ---------------------------------------------------------------------------
NATURAL_FARMING_DOCS = [
    # General Natural Farming / Jeevamrut
    {
        "id": "jeevamrut_prep",
        "text": "जीवामृत (Jeevamrut) बनाने की विधि: 200 लीटर पानी में 10 किलो गाय का गोबर, 5 से 10 लीटर गोमूत्र, 2 किलो गुड़, 2 किलो बेसन (चना दाल का आटा) और 1 मुट्ठी खेत की मेड़ की मिट्टी मिलाएं। इसे छाया में रखकर 72 घंटे तक फर्मेंट होने दें। दिन में दो बार लकड़ी से हिलाएं। यह प्राकृतिक खाद मिट्टी में सूक्ष्मजीवों की संख्या बढ़ाकर फसल को सभी पोषक तत्व प्रदान करती है। इसे पानी के साथ या छिड़काव द्वारा फसल में दिया जाता है।",
        "metadata": {"category": "fertilizer", "crop": "all", "lang": "hi"}
    },
    {
        "id": "jeevamrut_prep_hl",
        "text": "Jeevamrut (जीवामृत) banane ki vidhi: 200 liter paani mein 10 kg cow dung (gobar), 5-10 liter cow urine (gomutra), 2 kg jaggery (gud), 2 kg gram flour (besan) aur 1 mutthi farm soil mix karein. Ise 72 hours tak shade mein ferment hone dein. Din mein do baar dande se hilayein. Ye natural liquid fertilizer soil micro-organisms badhata hai aur crops ko nutrient deta hai.",
        "metadata": {"category": "fertilizer", "crop": "all", "lang": "hl"}
    },
    {
        "id": "beejamrut_seed_treatment",
        "text": "बीजामृत (Beejamrut) बीज उपचार: 20 लीटर पानी, 5 किलो गाय का गोबर, 5 लीटर गोमूत्र, 50 ग्राम चूना और 1 मुट्ठी मेड़ की मिट्टी को मिलाकर घोल बनाएं। बुवाई से पहले बीजों को इस घोल से उपचारित करके सुखा लें। बीजामृत बीजों को फंगस (कवक) और मिट्टी जनित बीमारियों से बचाता है तथा अंकुरण क्षमता बढ़ाता है।",
        "metadata": {"category": "seed_treatment", "crop": "all", "lang": "hi"}
    },
    {
        "id": "beejamrut_seed_treatment_hl",
        "text": "Beejamrut (बीजामृत) seed treatment: 20 liter paani, 5 kg gobar, 5 liter gomutra, 50g choona (lime) aur 1 mutthi soil mix karke ghol banayein. Sowing se pehle seeds ko isse treat karke dry kar lein. Ye seeds ko fungus aur soil-borne diseases se bachata hai aur germination rate badhata.",
        "metadata": {"category": "seed_treatment", "crop": "all", "lang": "hl"}
    },
    
    # Natural Pest Control
    {
        "id": "neemastra_pest_control",
        "text": "नीमास्त्र (Neemastra) कीट नियंत्रण: रस चूसने वाले कीड़ों, थ्रिप्स और छोटी इल्लियों के लिए बहुत प्रभावी है। बनाने की विधि: 100 लीटर पानी में 5 लीटर गोमूत्र, 2 किलो गोबर और 5 किलो नीम की पत्तियों की चटनी (पीसकर) मिलाएं। इसे 24 घंटे के लिए सड़ने दें, फिर छानकर सीधे फसल पर छिड़काव करें। रासायनिक कीटनाशकों का बिल्कुल भी प्रयोग न करें।",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "hi"}
    },
    {
        "id": "neemastra_pest_control_hl",
        "text": "Neemastra (नीमास्त्र) pest control: Ras choosne wale insects, thrips aur small caterpillars ke liye bohot effective hai. Vidhi: 100 liter paani mein 5 liter gomutra, 2 kg gobar aur 5 kg neem ki patti ka paste mix karein. 24 hours ke liye chhod dein, phir filter karke direct spray karein. Chemical pesticides bilkul use na karein.",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "hl"}
    },
    {
        "id": "agniastra_caterpillars",
        "text": "अग्नियास्त्र (Agniastra) बड़ी इल्लियों और तना छेदक के लिए: 100 लीटर पानी में 5 लीटर गोमूत्र, 1 किलो तीखी हरी मिर्च की चटनी, 500 ग्राम लहसुन का पेस्ट और 5 किलो नीम की पत्तियों का पेस्ट मिलाकर उबालें। इसे ठंडा करके 48 घंटे रखें, फिर छान लें। प्रति एकड़ 2 से 3 लीटर अग्नियास्त्र को 100 लीटर पानी में मिलाकर छिड़काव करें। रासायनिक कीटनाशक हानिकारक होते हैं।",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "hi"}
    },
    {
        "id": "dashparni_ark_disease",
        "text": "दशपर्णी अर्क (Dashparni Ark) एक शक्तिशाली प्राकृतिक कीटनाशक और फफूंदनाशक है जो सभी प्रकार के कीड़ों और रोगों से बचाता है। इसे नीम, करंज, अरंडी, धतूरा, बेल, आक, अमरूद, आम और शरीफा जैसी 10 तरह की पत्तियों को गोमूत्र और गोबर के साथ फर्मेंट करके बनाया जाता है। रासायनिक कीटनाशकों की तुलना में यह पूरी तरह सुरक्षित और प्राकृतिक है।",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "hi"}
    },
    {
        "id": "sour_buttermilk_fungus",
        "text": "खट्टी छाछ का छिड़काव (Sour Buttermilk Spray): फंगस (कवक) जनित रोगों, ब्लाइट, डाउनी मिल्ड्यू और पाउडर मिल्ड्यू के नियंत्रण के लिए तांबे के बर्तन में 5-7 दिनों तक रखी गई खट्टी छाछ बहुत प्रभावी है। 5 लीटर खट्टी छाछ को 100 लीटर पानी में मिलाकर फसलों पर छिड़काव करें। यह फंगस को नष्ट कर फसल को हरा-भरा बनाती है।",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "hi"}
    },

    # Crop Specific Guidance: Wheat
    {
        "id": "crop_wheat_natural",
        "text": "गेहूं की प्राकृतिक खेती (Wheat Natural Farming): गेहूं की बुवाई नवंबर में करें। बीजामृत से बीजों को उपचारित करें। बुवाई के समय प्रति एकड़ 4 क्विंटल घनजीवामृत मिट्टी में मिलाएं। पहली सिंचाई पर पानी के साथ 200 लीटर जीवामृत दें। हर 21 दिन में पानी के साथ जीवामृत देने से बंपर पैदावार होती है। पीला रतुआ (Yellow Rust) के इलाज के लिए रासायनिक कवकनाशी के बजाय 5 लीटर खट्टी छाछ को 100 लीटर पानी में मिलाकर छिड़काव करें।",
        "metadata": {"category": "crop_guide", "crop": "wheat", "lang": "hi"}
    },
    {
        "id": "crop_wheat_natural_hl",
        "text": "Gehun ki natural farming (गेहूं प्राकृतिक खेती): November mein sowing karein. Seeds ko Beejamrut se treat karein. Sowing time 4 quintal Ghanajeevamrut soil mein dalein. Pehli irrigation (irrigation/paani) ke sath 200 liter Jeevamrut dein. Yellow rust disease ke liye chemical fungicide ki jagah 5 liter sour buttermilk (khatti chhaachh) ko 100 liter paani mein milakar spray karein.",
        "metadata": {"category": "crop_guide", "crop": "wheat", "lang": "hl"}
    },

    # Crop Specific Guidance: Tomato
    {
        "id": "crop_tomato_natural",
        "text": "टमाटर की प्राकृतिक खेती (Tomato Natural Farming): टमाटर में लीफ कर्ल वायरस (Leaf Curl Virus) और अर्ली ब्लाइट की समस्या आम है। लीफ कर्ल वायरस सफेद मक्खी (Whitefly) से फैलता है। इसे नियंत्रित करने के लिए पीले स्टिकी ट्रैप (Yellow Sticky Traps) लगाएं और 10% नीम के अर्क (Neemastra) का छिड़काव करें। रासायनिक कीटनाशकों का प्रयोग न करें क्योंकि वे मित्र कीड़ों को मार देते हैं। मिट्टी की नमी बनाए रखने के लिए सूखी पत्तियों से मल्चिंग (Mulching) करें।",
        "metadata": {"category": "crop_guide", "crop": "tomato", "lang": "hi"}
    },
    {
        "id": "crop_tomato_natural_hl",
        "text": "Tamatar natural farming: Tamatar mein Leaf Curl Virus whitefly ki wajah se failta hai. Control ke liye Yellow Sticky Traps lagayein aur 10% Neemastra spray karein. Chemical pesticide use na karein kyuki ye beneficial insects ko maar dete hain. Soil moisture maintain karne ke liye dry leaves se mulching (मल्चिंग) karein.",
        "metadata": {"category": "crop_guide", "crop": "tomato", "lang": "hl"}
    },

    # Crop Specific Guidance: Onion
    {
        "id": "crop_onion_natural",
        "text": "प्याज की प्राकृतिक खेती (Onion Natural Farming): प्याज में थ्रिप्स (Thrips) कीट पत्तियों का रस चूसते हैं जिससे पत्तियां पीली पड़ जाती हैं। इसके नियंत्रण के लिए प्रति एकड़ 5 लीटर नीमास्त्र का छिड़काव करें। फंगस जनित जलेबी रोग या टविस्टर बीमारी के लिए खट्टी छाछ का छिड़काव करें। प्याज की अच्छी वृद्धि के लिए रोपाई के समय मिट्टी में घनजीवामृत और जीवामृत का नियमित प्रयोग करें।",
        "metadata": {"category": "crop_guide", "crop": "onion", "lang": "hi"}
    },

    # Crop Specific Guidance: Paddy
    {
        "id": "crop_paddy_natural",
        "text": "धान की प्राकृतिक खेती (Paddy Natural Farming): बासमती और अन्य धान की किस्मों में झोंका रोग (Blast Disease) और तना छेदक (Stem Borer) मुख्य समस्याएं हैं। ब्लाइट और ब्लास्ट रोग के नियंत्रण के लिए 5 लीटर खट्टी छाछ और गोमूत्र का मिश्रण बनाकर छिड़काव करें। तना छेदक के लिए अग्नियास्त्र का उपयोग करें। धान के खेत में रासायनिक यूरिया के स्थान पर अजोला (Azola) का उपयोग करें, जो नाइट्रोजन का प्राकृतिक स्रोत है।",
        "metadata": {"category": "crop_guide", "crop": "paddy", "lang": "hi"}
    },

    # Crop Specific Guidance: Cotton
    {
        "id": "crop_cotton_natural",
        "text": "कपास की प्राकृतिक खेती (Cotton Natural Farming): कपास में गुलाबी सुंडी (Pink Bollworm) और रस चूसक कीटों का प्रकोप सबसे अधिक होता है। गुलाबी सुंडी के नियंत्रण के लिए खेत में फेरोमोन ट्रैप (Pheromone Traps) लगाएं। शुरुआत में ही 5% नीम अर्क या नीमास्त्र का छिड़काव करें। रासायनिक खादों के छिड़काव से बचें, यह मिट्टी को बंजर और कीड़ों को अधिक आक्रामक बनाता है।",
        "metadata": {"category": "crop_guide", "crop": "cotton", "lang": "hi"}
    },

    # Crop Specific Guidance: Sugarcane
    {
        "id": "crop_sugarcane_natural",
        "text": "गन्ने की प्राकृतिक खेती (Sugarcane Natural Farming): गन्ना एक लंबी अवधि की फसल है जिसके लिए भरपूर जैविक कार्बन की आवश्यकता होती है। गन्ने के कचरे (सूखी पत्तियों) को खेत में ही फैलाकर मल्चिंग करें और उस पर जीवामृत का छिड़काव करें ताकि कचरा जल्दी सड़कर खाद बन सके। लाल सड़न रोग (Red Rot) से बचाव के लिए बीजों को बीजामृत से अवश्य उपचारित करें। सह-फसली खेती (जैसे गन्ना + धनिया या आलू) अपनाएं।",
        "metadata": {"category": "crop_guide", "crop": "sugarcane", "lang": "hi"}
    },

    # Multilevel Cropping / Cropping Strategies
    {
        "id": "multilevel_cropping_guide",
        "text": "बहुस्तरीय फसल पद्धति (Multilevel Cropping): एक ही खेत में अलग-अलग ऊंचाई और जड़ की गहराई वाली फसलों को एक साथ उगाना बहुस्तरीय फसल पद्धति कहलाता है। उदाहरण के लिए, सबसे नीचे अदरक या हल्दी (जमीन के अंदर), मध्यम स्तर पर गेंदा या टमाटर, और सबसे ऊपर गन्ना या पपीता। यह जमीन की उर्वरता बढ़ाता है, खरपतवार रोकता है और प्रति इकाई क्षेत्र से किसान की आय को तीन गुना तक बढ़ा देता है।",
        "metadata": {"category": "cropping_strategy", "crop": "all", "lang": "hi"}
    },
    {
        "id": "multilevel_cropping_guide_hl",
        "text": "Multilevel cropping (बहुस्तरीय फसल पद्धति): Ek hi field par alag height aur root depth wali crops ko sath mein grow karna. E.g., Ground ke niche Ginger/Haldi, middle level par Tomato/Marigold, aur top level par Papaya/Sugarcane. Ye soil health ko protect karta hai aur income ko multiple times badhata hai.",
        "metadata": {"category": "cropping_strategy", "crop": "all", "lang": "hl"}
    },

    # KVK Helpline & Guardrails
    {
        "id": "kvk_helpline_disclaimer",
        "text": "कृषि विज्ञान केंद्र (KVK) सरकारी टोल-फ्री हेल्पलाइन नंबर 1800-180-1551 है। किसी भी गंभीर रोग या कीट के प्रकोप की स्थिति में, किसान भाई तुरंत इस नंबर पर कॉल करके अपने निकटतम कृषि वैज्ञानिक से मुफ्त सलाह प्राप्त कर सकते हैं। प्राकृतिक खेती से जुड़े किसी भी संशय के समाधान के लिए केवीके वैज्ञानिकों से संपर्क करना सर्वोत्तम है।",
        "metadata": {"category": "helpline", "crop": "all", "lang": "hi"}
    },
    {
        "id": "kvk_helpline_disclaimer_hl",
        "text": "Krishi Vigyan Kendra (KVK) toll-free government helpline number 1800-180-1551 hai. Kisi bhi severe disease ya pest outbreak mein is call center number par call karke free expert advice lein. Chemcial pesticides ya medicines use karne se pehle KVK helpline par zaroor consult karein.",
        "metadata": {"category": "helpline", "crop": "all", "lang": "hl"}
    },
    
    # English Natural Farming Context & Guidelines
    {
        "id": "jeevamrut_prep_en",
        "text": "How to prepare Jeevamrut (liquid organic fertilizer): Mix 10 kg cow dung, 5-10 liters cow urine, 2 kg jaggery, 2 kg pulse flour (besan), and a handful of farm soil in 200 liters of water. Let it ferment in shade for 72 hours, stirring twice daily. This natural manure increases soil micro-organisms and provides all essential nutrients.",
        "metadata": {"category": "fertilizer", "crop": "all", "lang": "en"}
    },
    {
        "id": "beejamrut_seed_treatment_en",
        "text": "Beejamrut seed treatment: Mix 20 liters water, 5 kg cow dung, 5 liters cow urine, 50g lime (choona), and a handful of farm soil to make a slurry. Treat seeds with this mixture before sowing and dry them in shade. Beejamrut protects seeds from soil-borne diseases and improves germination.",
        "metadata": {"category": "seed_treatment", "crop": "all", "lang": "en"}
    },
    {
        "id": "neemastra_pest_control_en",
        "text": "Neemastra pest control: Highly effective against sap-sucking pests, thrips, and small caterpillars. Mix 5 liters cow urine, 2 kg cow dung, and 5 kg neem leaf paste in 100 liters of water. Let it ferment for 24 hours, filter it, and spray directly. Avoid chemical pesticides entirely.",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "en"}
    },
    {
        "id": "agniastra_caterpillars_en",
        "text": "Agniastra for caterpillars and stem borers: Boil 5 liters cow urine, 1 kg hot green chili paste, 500g garlic paste, and 5 kg neem leaf paste in 100 liters water. Cool and ferment for 48 hours, then filter. Spray 2-3 liters of Agniastra mixed in 100 liters of water per acre. Chemical pesticides are harmful.",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "en"}
    },
    {
        "id": "sour_buttermilk_fungus_en",
        "text": "Sour Buttermilk spray for fungal control: Ferment sour buttermilk in a copper container for 5-7 days. Mix 5 liters of this sour buttermilk with 100 liters of water and spray on crops. It is highly effective against leaf spot, blight, downy mildew, and powdery mildew.",
        "metadata": {"category": "pest_control", "crop": "all", "lang": "en"}
    },
    {
        "id": "crop_wheat_natural_en",
        "text": "Natural farming for Wheat: Sow wheat in November. Treat seeds with Beejamrut. Mix 4 quintals of Ghanjeevamrut per acre in the soil at sowing. Irrigate 21 days after sowing with 200 liters of Jeevamrut. For yellow rust control, spray 5 liters sour buttermilk mixed in 100 liters water per acre instead of chemicals.",
        "metadata": {"category": "crop_guide", "crop": "wheat", "lang": "en"}
    },
    {
        "id": "crop_tomato_natural_en",
        "text": "Natural farming for Tomato: Control Leaf Curl Virus (spread by whiteflies) by installing Yellow Sticky Traps and spraying 10% Neemastra. Avoid chemical pesticides as they kill beneficial insects. Apply dry leaf mulching to conserve soil moisture.",
        "metadata": {"category": "crop_guide", "crop": "tomato", "lang": "en"}
    },
    {
        "id": "crop_onion_natural_en",
        "text": "Natural farming for Onion: Control thrips (sap-sucking pests) by spraying 5 liters Neemastra per acre. Use sour buttermilk spray for fungal twisting or blight diseases. Apply Ghanjeevamrut and Jeevamrut regularly for bulb development.",
        "metadata": {"category": "crop_guide", "crop": "onion", "lang": "en"}
    },
    {
        "id": "crop_paddy_natural_en",
        "text": "Natural farming for Paddy (Rice): Control Blast disease and stem borer. Spray a mixture of 5 liters sour buttermilk and cow urine for blast. Use Agniastra for stem borer. Use Azolla in paddy fields as a natural source of nitrogen instead of chemical urea.",
        "metadata": {"category": "crop_guide", "crop": "paddy", "lang": "en"}
    },
    {
        "id": "crop_cotton_natural_en",
        "text": "Natural farming for Cotton: Control Pink Bollworm and sucking pests. Install pheromone traps in the field. Spray 5% Neem extract or Neemastra. Avoid chemical fertilizers, which make pests more aggressive and degrade soil.",
        "metadata": {"category": "crop_guide", "crop": "cotton", "lang": "en"}
    },
    {
        "id": "crop_sugarcane_natural_en",
        "text": "Natural farming for Sugarcane: Use dry leaves for mulching and spray Jeevamrut to accelerate composting. Treat sugarcane setts with Beejamrut to prevent Red Rot disease. Adopt companion cropping like sugarcane with potato or coriander.",
        "metadata": {"category": "crop_guide", "crop": "sugarcane", "lang": "en"}
    },
    {
        "id": "multilevel_cropping_guide_en",
        "text": "Multilevel Cropping: Growing crops of different heights and root depths together. For example, ginger or turmeric (ground), marigold or tomato (middle), and papaya or sugarcane (top). This conserves space, suppresses weeds, and triples farmer income.",
        "metadata": {"category": "cropping_strategy", "crop": "all", "lang": "en"}
    },
    {
        "id": "kvk_helpline_disclaimer_en",
        "text": "Krishi Vigyan Kendra (KVK) Government Toll-Free Helpline: 1800-180-1551. In case of severe pest or crop disease outbreak, farmers can call this free registry number to get immediate advice from agricultural scientists. Always consult KVK before resorting to chemical treatments.",
        "metadata": {"category": "helpline", "crop": "all", "lang": "en"}
    }
]


def ingest_initial_knowledge(docs: List[Dict[str, Any]] = None):
    """Ingest the natural farming knowledge documents into ChromaDB."""
    if docs is None:
        docs = NATURAL_FARMING_DOCS
    if not docs:
        return

    collection = get_chroma_collection()
    model = get_rag_model()

    logger.info(f"Generating embeddings for {len(docs)} natural farming knowledge base documents...")
    ids = []
    documents = []
    metadatas = []
    embeddings = []

    for doc in docs:
        ids.append(doc["id"])
        documents.append(doc["text"])
        metadatas.append(doc["metadata"])
        # Generate embedding vector
        emb = model.encode(doc["text"]).tolist()
        embeddings.append(emb)

    logger.info(f"Adding {len(documents)} documents to ChromaDB...")
    try:
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings
        )
        logger.info("Knowledge base auto-ingestion completed successfully.")
    except Exception as e:
        logger.error(f"Error during auto-ingestion: {e}")


def query_knowledge_base(query: str, limit: int = 3, lang: str = "hi") -> str:
    """
    Search the natural farming knowledge base using a fast weighted keyword-based matching algorithm.
    Runs in <1ms and does not require loading neural network models on CPU.
    """
    try:
        # Filter documents by target language
        # Fall back to general Hindi documents if target language is empty or not matching
        lang_docs = [doc for doc in NATURAL_FARMING_DOCS if doc["metadata"].get("lang") == lang]
        if not lang_docs:
            lang_docs = [doc for doc in NATURAL_FARMING_DOCS if doc["metadata"].get("lang") == "hi"]

        query_lower = query.lower()
        
        # Safe punctuation clean to keep Devanagari Unicode matras/vowels intact
        clean_query = query_lower
        for char in "?.,!/()-_:;'\"।":
            clean_query = clean_query.replace(char, " ")
        query_tokens = [w for w in re.split(r'\s+', clean_query) if w]
        
        # High importance query keywords for agriculture
        keywords_weights = {
            # Crops
            "wheat": 5, "गेहूं": 5, "gehun": 5,
            "tomato": 5, "टमाटर": 5, "tamatar": 5,
            "onion": 5, "प्याज": 5, "pyaj": 5,
            "paddy": 5, "धान": 5, "dhan": 5, "rice": 5,
            "cotton": 5, "कपास": 5, "kapas": 5,
            "sugarcane": 5, "गन्ने": 5, "ganna": 5,
            # Remedies
            "jeevamrut": 8, "जीवामृत": 8,
            "beejamrut": 8, "बीजामृत": 8,
            "neemastra": 8, "नीमास्त्र": 8,
            "agniastra": 8, "अग्नियास्त्र": 8,
            "dashparni": 8, "दशपर्णी": 8,
            "buttermilk": 8, "छाछ": 8, "chhaachh": 8,
            "helpline": 4, "हेल्पलाइन": 4, "kvk": 4
        }
        
        # Common connectives/prepositions in Hindi & English to filter out from word matching
        stop_words = {"की", "का", "के", "में", "से", "को", "पर", "और", "है", "हैं", "था", "थी", "थे", "तो", "ही", "भी", "in", "of", "to", "for", "on", "and", "the", "a", "an", "is"}
        
        scored_docs = []
        for doc in lang_docs:
            doc_text = doc["text"].lower()
            score = 0
            unique_matches = 0
            
            # 1. Base keyword matches (capped frequency at 2 to prevent keyword repeating bias)
            for token in query_tokens:
                if token in stop_words:
                    continue
                if token in doc_text:
                    unique_matches += 1
                    weight = keywords_weights.get(token, 1)
                    count = min(doc_text.count(token), 2)
                    score += weight * count
                    
            # 2. Add Coordinate Matching / Unique Token Boost
            if unique_matches > 0:
                score += unique_matches * 10
                    
            # 3. Boost metadata properties
            metadata = doc.get("metadata", {})
            crop = metadata.get("crop", "").lower()
            category = metadata.get("category", "").lower()
            
            for token in query_tokens:
                if token in stop_words:
                    continue
                if crop and token == crop:
                    score += 10
                if category and token == category:
                    score += 5
                    
            # 4. Boost phrase matches
            phrase_matches = [
                ("yellow rust", 15), ("पीला रतुआ", 15),
                ("leaf curl", 15), ("लीफ कर्ल", 15),
                ("sour buttermilk", 15), ("खट्टी छाछ", 15),
                ("pink bollworm", 15), ("गुलाबी सुंडी", 15),
                ("stem borer", 15), ("तना छेदक", 15),
                ("seed treatment", 15), ("बीज उपचार", 15),
                ("natural farming", 10), ("प्राकृतिक खेती", 10),
                ("बनाने की विधि", 20), ("विधि", 5), ("कैसे बनाएं", 20)
            ]
            for phrase, bonus in phrase_matches:
                if phrase in query_lower and phrase in doc_text:
                    score += bonus

            scored_docs.append((score, doc["text"]))
            
        # Sort docs descending by score
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        # Filter docs that scored > 0
        top_docs = [text for score, text in scored_docs[:limit] if score > 0]
        
        # Fallback to general natural farming guidelines if no specific crop/remedy matches
        if not top_docs:
            default_ids = ["jeevamrut_prep", "jeevamrut_prep_hl", "jeevamrut_prep_en",
                           "beejamrut_seed_treatment", "beejamrut_seed_treatment_hl", "beejamrut_seed_treatment_en"]
            default_docs = [doc["text"] for doc in lang_docs if doc["id"] in default_ids]
            top_docs = default_docs[:limit]
            
        context_block = "\n---\n".join(top_docs)
        logger.info(f"Fast keyword RAG search successful. Retrieved {len(top_docs)} context chunks.")
        return context_block
        
    except Exception as e:
        logger.error(f"Error in fast RAG query: {e}")
        return ""
