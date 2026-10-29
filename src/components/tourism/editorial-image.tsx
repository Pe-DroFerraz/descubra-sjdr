import { useState } from 'react';
import { commonsCredit, commonsImage, imageSources, type PhotoKey } from '../../data/editorial';
type Props={ photo:PhotoKey;alt?:string;className?:string;eager?:boolean;credit?:boolean};
export function EditorialImage({photo,alt,className='',eager=false,credit=true}:Props){
  const [failed,setFailed]=useState(false);
  return <div className={'visual-photo '+className}>
    <img src={failed?'/heritage.svg':commonsImage(photo,eager?1600:960)}
      alt={alt??imageSources[photo].alt}
      loading={eager?'eager':'lazy'} decoding="async"
      onError={()=>setFailed(true)} />
    {credit&&<a href={commonsCredit(photo)} target="_blank" rel="noopener noreferrer"
      className="visual-photo-credit" title={imageSources[photo].credit}>Fotografia · créditos</a>}
  </div>;
}
