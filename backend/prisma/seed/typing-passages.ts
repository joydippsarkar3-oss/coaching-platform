/**
 * Typing passage seed data
 * 5 English passages (technology / computers) + 5 Hindi passages (computers / work)
 * Exported as an array for use in prisma/seed.ts
 */

export interface PassageSeed {
  language: string;
  difficulty: string;
  text: string;
  wordCount: number;
  charCount: number;
  source?: string;
}

export const typingPassages: PassageSeed[] = [
  // ── English — Easy ──────────────────────────────────────────────────────────
  {
    language: 'en',
    difficulty: 'easy',
    text: 'A computer is a machine that can store and process information. It follows instructions given by the user. Computers are used in offices, schools, and homes. They help us write documents, browse the internet, and play games. Learning to type fast is a useful skill for every computer user.',
    wordCount: 50,
    charCount: 0, // computed below
    source: 'Platform Typing Seed',
  },
  // ── English — Medium ────────────────────────────────────────────────────────
  {
    language: 'en',
    difficulty: 'medium',
    text: 'The central processing unit, commonly known as the CPU, is the brain of the computer. It performs all the calculations and executes instructions. Modern CPUs contain billions of transistors on a single chip. Along with the CPU, a computer also has random access memory, storage devices, and input-output peripherals that work together to complete tasks efficiently.',
    wordCount: 62,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── English — Hard ──────────────────────────────────────────────────────────
  {
    language: 'en',
    difficulty: 'hard',
    text: 'Operating systems serve as the intermediary between computer hardware and application software. They manage resources such as processor time, memory allocation, file storage, and input-output operations. Popular operating systems include Microsoft Windows, Apple macOS, and various distributions of Linux. Without an operating system, users would need to write machine-level code to interact directly with hardware components, which would make everyday computing extraordinarily difficult.',
    wordCount: 72,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── English — Medium (extra) ────────────────────────────────────────────────
  {
    language: 'en',
    difficulty: 'medium',
    text: 'The internet connects millions of computers around the world using a set of rules called protocols. The most common protocol is TCP/IP, which governs how data is broken into packets and transmitted. Web browsers use the HTTP and HTTPS protocols to display websites. Email, file transfer, and video streaming all rely on the internet infrastructure that has transformed how people communicate and work.',
    wordCount: 67,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── English — Easy (extra) ──────────────────────────────────────────────────
  {
    language: 'en',
    difficulty: 'easy',
    text: 'A keyboard and a mouse are the most common input devices for a computer. The keyboard has letters, numbers, and special keys. You press keys to type text or give commands. The mouse lets you move a pointer on the screen and click on items. Good typing speed and accuracy make your work much faster and easier.',
    wordCount: 56,
    charCount: 0,
    source: 'Platform Typing Seed',
  },

  // ── Hindi — Easy ────────────────────────────────────────────────────────────
  {
    language: 'hi',
    difficulty: 'easy',
    text: 'कंप्यूटर एक इलेक्ट्रॉनिक मशीन है जो डेटा को संग्रहीत और प्रसंस्कृत करती है। यह उपयोगकर्ता के निर्देशों का पालन करती है। आज कंप्यूटर का उपयोग हर क्षेत्र में होता है। टाइपिंग सीखना आज के युग में बहुत जरूरी है।',
    wordCount: 34,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── Hindi — Medium ──────────────────────────────────────────────────────────
  {
    language: 'hi',
    difficulty: 'medium',
    text: 'कंप्यूटर के मुख्य भाग होते हैं जैसे कि सेंट्रल प्रोसेसिंग यूनिट, मेमोरी, इनपुट और आउटपुट डिवाइस। सीपीयू को कंप्यूटर का मस्तिष्क कहा जाता है। रैम में डेटा अस्थायी रूप से संग्रहीत होता है जबकि हार्ड डिस्क में डेटा स्थायी रूप से सुरक्षित रहता है। ये सभी भाग मिलकर एक कार्यशील कंप्यूटर प्रणाली बनाते हैं।',
    wordCount: 52,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── Hindi — Hard ────────────────────────────────────────────────────────────
  {
    language: 'hi',
    difficulty: 'hard',
    text: 'इंटरनेट एक वैश्विक नेटवर्क है जो करोड़ों कंप्यूटरों को आपस में जोड़ता है। इसके माध्यम से हम ईमेल भेज सकते हैं, वेबसाइट देख सकते हैं और वीडियो कॉल कर सकते हैं। टीसीपी/आईपी प्रोटोकॉल के आधार पर डेटा छोटे-छोटे पैकेट में विभाजित होकर एक स्थान से दूसरे स्थान तक पहुंचता है। आधुनिक डिजिटल अर्थव्यवस्था में इंटरनेट की भूमिका अत्यंत महत्वपूर्ण हो गई है।',
    wordCount: 60,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── Hindi — Easy (extra) ────────────────────────────────────────────────────
  {
    language: 'hi',
    difficulty: 'easy',
    text: 'कीबोर्ड कंप्यूटर का एक इनपुट उपकरण है। इसमें अक्षर, संख्याएं और विशेष कुंजियां होती हैं। माउस से हम स्क्रीन पर कहीं भी क्लिक कर सकते हैं। नियमित अभ्यास से टाइपिंग गति बढ़ती है।',
    wordCount: 32,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
  // ── Hindi — Medium (extra) ──────────────────────────────────────────────────
  {
    language: 'hi',
    difficulty: 'medium',
    text: 'ऑपरेटिंग सिस्टम कंप्यूटर के हार्डवेयर और सॉफ्टवेयर के बीच एक माध्यम का काम करता है। विंडोज, मैकओएस और लिनक्स प्रमुख ऑपरेटिंग सिस्टम हैं। यह प्रोसेसर, मेमोरी और फाइल सिस्टम का प्रबंधन करता है। किसी भी कार्यालय में कार्य करने के लिए ऑपरेटिंग सिस्टम की बुनियादी जानकारी होना आवश्यक है।',
    wordCount: 48,
    charCount: 0,
    source: 'Platform Typing Seed',
  },
].map((p) => ({ ...p, charCount: p.text.length }));
