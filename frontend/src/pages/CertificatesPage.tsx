import { useEffect, useState } from 'react';
import { certificateService, type Certificate } from '../services/certificateService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateService.list()
      .then(setCerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">ใบประกาศของฉัน</h2>
      {certs.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-8">ยังไม่มีใบประกาศ — เรียนจบคอร์สเพื่อรับใบประกาศ</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((cert) => (
            <Card key={cert.id}>
              <h3 className="font-semibold text-gray-800">{cert.course?.title}</h3>
              <p className="text-sm text-gray-500 mt-1">ออกเมื่อ: {new Date(cert.issuedAt).toLocaleDateString('th-TH')}</p>
              <a
                href={certificateService.downloadUrl(cert.courseId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4"
              >
                <Button variant="secondary">ดาวน์โหลด</Button>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
