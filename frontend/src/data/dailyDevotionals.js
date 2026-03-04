// Daily devotional content generator for church planting journey
// Uses the Bible reading plan from BibleReadingPlan.docx
import { getBiblePassageForDate } from './bibleReadingPlan';
import { getKeyVerseForChapter } from './keyVerses';

// Church planting themes with rhyming principles
const themes = [
  { 
    theme: "Foundation & Calling",
    rhyme: "Start each day in prayer before action; God's morning voice directs your mission. Seek His face when dawn breaks through, and He will guide in all you do."
  },
  { 
    theme: "Spiritual Multiplication", 
    rhyme: "Multiplication beats addition every time; invest in the faithful, watch them climb. One becomes two, two become four—this is the math that heaven adores."
  },
  { 
    theme: "Gospel Proclamation", 
    rhyme: "Speak the gospel clear, simple, and true; complexity hides what grace wants to do. Faith comes by hearing, hearing by the Word proclaimed—presence without proclamation leaves salvation unclaimed."
  },
  { 
    theme: "Building Relationships", 
    rhyme: "Relationships are built with time and care; show up consistently, and be there. Love builds the bridge that truth walks across—invest your time, count it not as loss."
  },
  { 
    theme: "Faith & Provision", 
    rhyme: "God's provision matches His mission call; trust Him for much when you have small. Step out in faith when resources are few—watch Him multiply what He gives to you."
  },
  { 
    theme: "Perseverance", 
    rhyme: "When results seem slow and progress slight, keep sowing seeds—God works at night. The harvest will come in His perfect time—stay faithful to the work, stay true to the climb."
  },
  { 
    theme: "Prayer & Intercession", 
    rhyme: "Prayer moves mountains, opens doors shut tight; intercession is your greatest fight. The battle is won on your knees in the dark—before you see victory, you must make your mark."
  },
  { 
    theme: "Community Formation", 
    rhyme: "Church is family, not event or show; deep communion makes disciples grow. Gather the believers, teach them to care—the watching world will see Jesus there."
  },
  {
    theme: "Boldness in Witness",
    rhyme: "Speak the name of Jesus without fear or shame; let the city of Puerto Princesa know His name. Boldness comes when you know you're sent—preach the Word with holy intent."
  },
  {
    theme: "Humble Servanthood",
    rhyme: "The greatest leader is the servant of all; answer the call to stoop and to crawl. Wash their feet, meet their need—greatness is measured by those you feed."
  },
  {
    theme: "Spiritual Disciplines",
    rhyme: "Discipline today brings power tomorrow; in the secret place, strength you'll borrow. Fast and pray when the work is hard—your reward will come from the Lord's regard."
  },
  {
    theme: "Disciple-Making",
    rhyme: "Disciples first must follow before they lead; spiritual formation is the foundational seed. Walk with Jesus, then teach others to do the same—following comes before using His name."
  },
  {
    theme: "Kingdom Perspective",
    rhyme: "Your Jerusalem is where your feet now stand; be faithful here before distant lands. Win your city, reach your street—global impact starts with local feet."
  },
  {
    theme: "Trust in God's Timing",
    rhyme: "You plant the seed, another may water well; but only God can make the harvest swell. Release the need for instant fruit to see—trust Him for growth, your job's to be free."
  }
];

// Practical action steps for church planting
const applications = [
  "Pray this passage over your Timothys by name today.",
  "Share this verse with a student at WPU or PSU via text.",
  "Journal how this truth applies to your current ministry challenge.",
  "Memorize the key verse and quote it when doubt creeps in.",
  "Ask God: What is one specific action I should take based on this passage?",
  "Identify one person who needs to hear this truth today.",
  "Reflect: How does this passage equip me for campus ministry?",
  "Pray for Puerto Princesa using themes from today's reading.",
  "Before stepping on campus today, pray: 'Lord, let me represent You well.'",
  "Fast and pray if this passage convicts you of something to surrender.",
  "Prayer-walk one barangay near WPU or PSU today.",
  "Write down 3 fears or doubts you have about this church plant. Pray over each one.",
  "Spend at least 2 hours on campus today. Don't preach—just listen and build relationships.",
  "Ask 3 students: 'What's your biggest question about life or purpose?' Listen fully.",
  "Invite one potential Timothy to join you in a campus prayer walk."
];

// 6-Year Church Planting Targets (March 2026 - March 2032)
export const CHURCH_PLANT_START_DATE = new Date('2026-03-01');

export const yearlyTargets = {
  // Year 1: SEED & SURVEY (Mar 2026 - Feb 2027)
  1: {
    phase: "Seed & Survey",
    motto: "Identify 3-5 Timothys; weekly Bible study",
    monthly: {
      peopleContacted: 10,
      gospelConversations: 5,
      timothyMeetings: 4,
      budgetLimit: 11400 // PHP
    },
    yearly: {
      identifiedTimothys: 5,
      weeklyBibleStudyLaunched: true,
      totalPeopleReached: 120,
      attendanceGoal: 10,
      disciples: 5
    }
  },
  // Year 2: ROOT & GROW (Mar 2027 - Feb 2028)
  2: {
    phase: "Root & Grow",
    motto: "Launch Sunday gathering; 2 discipleship groups",
    monthly: {
      peopleContacted: 15,
      gospelConversations: 8,
      timothyMeetings: 6,
      budgetLimit: 11400
    },
    yearly: {
      identifiedTimothys: 8,
      discipleshipGroups: 2,
      totalPeopleReached: 180,
      attendanceGoal: 30,
      disciples: 15,
      sundayGatheringLaunched: true
    }
  },
  // Year 3: BRANCH & MULTIPLY (Mar 2028 - Feb 2029)
  3: {
    phase: "Branch & Multiply",
    motto: "Timothy-led cell groups; WPU & PSU outreach",
    monthly: {
      peopleContacted: 20,
      gospelConversations: 12,
      timothyMeetings: 8,
      budgetLimit: 11400
    },
    yearly: {
      timothyLedGroups: 3,
      campusClubs: 2,
      totalPeopleReached: 240,
      attendanceGoal: 60,
      disciples: 30,
      faithfulMenRaised: 10
    }
  },
  // Year 4: STRUCTURE & SEND (Mar 2029 - Feb 2030)
  4: {
    phase: "Structure & Send",
    motto: "Formal leadership; Timothy micro-churches",
    monthly: {
      peopleContacted: 25,
      gospelConversations: 15,
      timothyMeetings: 10,
      budgetLimit: 11400
    },
    yearly: {
      eldersAppointed: 3,
      deaconsAppointed: 5,
      microChurches: 2,
      totalPeopleReached: 300,
      attendanceGoal: 100,
      disciples: 50,
      selfFundingPercentage: 50
    }
  },
  // Year 5: ESTABLISH & COMMISSION (Mar 2030 - Mar 2031)
  5: {
    phase: "Establish & Commission",
    motto: "Self-sustaining church; send out planters",
    monthly: {
      peopleContacted: 30,
      gospelConversations: 20,
      timothyMeetings: 12,
      budgetLimit: 11400
    },
    yearly: {
      registered: true,
      churchPlantersSent: 2,
      daughterChurches: 2,
      totalPeopleReached: 360,
      attendanceGoal: 150,
      disciples: 80,
      selfFundingPercentage: 80
    }
  },
  // Year 6: REPRODUCE & REJOICE (Mar 2031 - Feb 2032)
  6: {
    phase: "Reproduce & Rejoice",
    motto: "Multiple reproducing groups; continued expansion",
    monthly: {
      peopleContacted: 35,
      gospelConversations: 25,
      timothyMeetings: 15,
      budgetLimit: 11400
    },
    yearly: {
      churchPlantersSent: 4,
      daughterChurches: 4,
      totalPeopleReached: 500,
      attendanceGoal: 200,
      disciples: 120,
      selfFundingPercentage: 100
    }
  }
};

// Format date as "Month DD, YYYY (DayOfWeek)"
const formatDateWithDay = (date) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const dayOfWeek = days[date.getDay()];
  
  return `${month} ${day}, ${year} (${dayOfWeek})`;
};

// Generate devotional content for a specific date
export const getDevotionalForDate = (dateString) => {
  // Get the Bible passage from the reading plan (Book + Chapter only)
  const bookChapter = getBiblePassageForDate(dateString);
  
  // Calculate day number for theme and practice selection
  const startDate = new Date('2026-03-01');
  const currentDate = new Date(dateString);
  const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(0, daysDiff) + 1; // Day 1 starts on March 1, 2026
  
  // Format the full passage string: "Day X - Month DD, YYYY (DayOfWeek) - Book Chapter"
  const formattedDate = formatDateWithDay(currentDate);
  const fullPassage = `Day ${dayNumber} - ${formattedDate} - ${bookChapter}`;
  
  // Get the key verse and principle for this chapter
  const keyVerseData = getKeyVerseForChapter(bookChapter);
  
  // Select practice based on day
  const practiceIndex = (dayNumber - 1) % applications.length;
  const practice = applications[practiceIndex];

  return {
    passage: fullPassage,
    keyVerse: keyVerseData.verse,
    keyVerseText: keyVerseData.text,
    principle: keyVerseData.principle,
    practice: practice
  };
};

// Helper function to get current ministry year (1-6)
export const getCurrentMinistryYear = (date = new Date()) => {
  const monthsDiff = Math.floor((date - CHURCH_PLANT_START_DATE) / (1000 * 60 * 60 * 24 * 30.44));
  const year = Math.floor(monthsDiff / 12) + 1;
  return Math.min(Math.max(year, 1), 6); // Clamp between 1 and 6
};

// Get targets for specific year
export const getYearTargets = (year) => {
  return yearlyTargets[year] || yearlyTargets[1];
};
