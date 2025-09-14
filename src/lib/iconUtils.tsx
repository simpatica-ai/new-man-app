import { Zap, Heart, Users, Shield, Target, Clock, Star } from 'lucide-react';

export const getDefectIcon = (iconName: string | null) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    'Zap': <Zap className="h-4 w-4" />,
    'Heart': <Heart className="h-4 w-4" />,
    'Users': <Users className="h-4 w-4" />,
    'Shield': <Shield className="h-4 w-4" />,
    'Target': <Target className="h-4 w-4" />,
    'Clock': <Clock className="h-4 w-4" />,
    'Star': <Star className="h-4 w-4" />
  };

  return iconMap[iconName || 'Heart'] || <Heart className="h-4 w-4" />;
};
