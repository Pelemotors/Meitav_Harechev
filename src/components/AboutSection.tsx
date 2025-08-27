import React from 'react';
import { Users, Award, Clock, ThumbsUp } from 'lucide-react';

const AboutSection = () => {
  const stats = [
    {
      icon: <Users className="w-8 h-8 text-slc-bronze" />,
      number: "2,500+",
      label: "רכבים נמכרו"
    },
    {
      icon: <Award className="w-8 h-8 text-slc-bronze" />,
      number: "10",
      label: "שנות ניסיון"
    },
    {
      icon: <Clock className="w-8 h-8 text-slc-bronze" />,
      number: "100%",
      label: "רכבים בדוקים"
    },
    {
      icon: <ThumbsUp className="w-8 h-8 text-slc-bronze" />,
      number: "98%",
      label: "שביעות רצון"
    }
  ];

  return (
    <section id="about" className="section bg-white">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content - Right Side */}
          <div className="text-right">
            <h2 className="text-4xl font-bold text-slc-dark mb-6">אודות  Strong Luxury Cars</h2>
            
            <div className="space-y-4 text-slc-gray text-lg leading-relaxed">
              <p>
              Strong Luxury Cars  הוא בית מכירות רכבים מוביל בנתניה, המתמחה 
                במכירת רכבים חדשים ומשומשים איכותיים. עם ניסיון של 10 שנה בתחום, 
                אנו מספקים שירות מקצועי ואמין לאלפי לקוחות מרוצים.
              </p>
              
              <p>
                הצוות המקצועי שלנו מורכב מיועצי מכירות מנוסים, המתמחים 
                בהתאמת הרכב המושלם לכל לקוח. אנו מתחייבים לשירות איכותי, 
                מחירים הוגנים ויחס אישי לכל לקוח.
              </p>
              
              <p>
                אצלנו תמצאו מגוון רחב של רכבים: החל מרכבים חדשים ממיטב היצרנים, 
                דרך רכבים משומשים בדוקים ומאושרים ועד לאפשרויות מימון נוחות 
                ותנאים מיוחדים.
              </p>
            </div>
            
            <div className="mt-8">
              <a href="#cars" className="btn-primary text-lg px-8 py-3">
                צפה ברכבים
              </a>
            </div>
          </div>
          
          {/* Statistics - Left Side */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-slc-light-gray rounded-xl hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                              <div className="text-3xl font-bold text-slc-dark mb-2">
                {stat.number}
              </div>
              <div className="text-slc-gray font-medium">
                {stat.label}
              </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;