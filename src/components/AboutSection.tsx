import React from 'react';
import { Users, Award, Clock, ThumbsUp, Car, ExternalLink } from 'lucide-react';
import { useCheapestCarInfo } from '../utils/carPricing';
import { useNavigate } from 'react-router-dom';

const AboutSection = () => {
  const { cheapestCar, cheapestPrice, loading } = useCheapestCarInfo();
  const navigate = useNavigate();

  const stats = [
    {
      icon: <Users className="w-8 h-8 text-white" />,
      number: "10,000+",
      label: "לקוחות מרוצים"
    },
    {
      icon: <Award className="w-8 h-8 text-white" />,
      number: "20+",
      label: "שנות ניסיון"
    },
    {
      icon: <Car className="w-8 h-8 text-white" />,
      number: loading ? "טוען..." : cheapestPrice ? `₪${cheapestPrice.toLocaleString()}` : "₪5,000",
      label: cheapestCar ? `${cheapestCar.name}` : "הרכב הזול ביותר במלאי"
    },
    {
      icon: <ThumbsUp className="w-8 h-8 text-white" />,
      number: "100%",
      label: "שירות אישי"
    }
  ];

  return (
    <section id="about" className="section bg-white">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content - Right Side */}
          <div className="text-right">
            <h2 className="text-4xl font-bold text-neutral-900 mb-6">למה לבחור במיטב הרכב?</h2>
            
            <div className="space-y-4 text-neutral-600 text-lg leading-relaxed">
              <p>
                מיטב הרכב היא סוכנות פרטית בחדרה שמאמינה שכל אחד צריך למצוא את הרכב שמתאים לו – גם לתקציב וגם לאורח החיים.
                עם ניסיון של שנים, שירות אישי, והתחייבות לאמינות – אנחנו כאן בשבילכם, עם רכב לכל כיס ומימון מותאם אישית.
              </p>
              
              <p>
                אצלנו לא "דוחפים" רכב – אלא מתאימים רכב. כי חשוב לנו שתצאו מרוצים, ושתחזרו שוב כשתרצו לשדרג.
              </p>
              
              <p>
                הצוות המקצועי שלנו מורכב מיועצי מכירות מנוסים, המתמחים 
                בהתאמת הרכב המושלם לכל לקוח. אנו מתחייבים לשירות איכותי, 
                מחירים הוגנים ויחס אישי לכל לקוח.
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
            {stats.map((stat, index) => {
              // אם זה הכרטיס של הרכב הזול ביותר ויש רכב זמין, נוסיף קישור
              const isCheapestCarCard = index === 2 && cheapestCar;
              
              const cardContent = (
                <div className={`modern-card text-center p-8 hover-lift animate-fade-in-up ${isCheapestCarCard ? 'cursor-pointer group' : ''}`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="flex justify-center mb-6 animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3 animate-pulse-slow">
                    {stat.number}
                  </div>
                  <div className="text-neutral-600 font-semibold text-lg">
                    {stat.label}
                  </div>
                  {isCheapestCarCard && (
                    <>
                      <div className="mt-3 px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-bold rounded-full">
                        הרכב הזול ביותר במלאי!
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2 text-primary-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>לחץ לצפייה</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </>
                  )}
                </div>
              );

              if (isCheapestCarCard) {
                return (
                  <div 
                    key={index}
                    onClick={() => navigate(`/car/${cheapestCar.id}`)}
                    className="cursor-pointer"
                  >
                    {cardContent}
                  </div>
                );
              }

              return <div key={index}>{cardContent}</div>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;