// The starting state of the demo event "[시연] 부스럭 캠퍼스 페스티벌" (read from the server on 2026-11-11).
// Used by the organizer dashboard's 시연 초기화 (utils/demoRestore.js). No passwords or secrets here.
export const DEMO_BASELINE = {
  "eventId": "d3e02026-1111-4000-8000-000000000200",
  "event": {
    "name": "[시연] 부스럭 캠퍼스 페스티벌",
    "venue": "캠퍼스 중앙광장",
    "description": "삭제 가능한 테스트 행사입니다. 실제 행사·연락처·결제 데이터가 아닙니다."
  },
  "booths": [
    {
      "id": "d3e02026-1111-4000-8000-000000000601",
      "name": "[시연] 달빛 떡볶이",
      "categoryCode": "FOOD",
      "description": "메뉴 검색·가격·재고를 확인하세요.",
      "operationStatus": "OPEN",
      "visibilityStatus": "PUBLIC",
      "items": [
        {
          "id": "d3e02026-1111-4000-8000-000000000701",
          "name": "[시연] 컵 떡볶이",
          "description": "기본 메뉴",
          "priceKrw": 4000,
          "stockStatus": "AVAILABLE",
          "sortOrder": 0
        },
        {
          "id": "d3e02026-1111-4000-8000-000000000702",
          "name": "[시연] 어묵",
          "description": "재고 부족 메뉴",
          "priceKrw": 2000,
          "stockStatus": "LOW",
          "sortOrder": 1
        },
        {
          "id": "d3e02026-1111-4000-8000-000000000703",
          "name": "[시연] 튀김",
          "description": "품절 메뉴",
          "priceKrw": 3000,
          "stockStatus": "SOLD_OUT",
          "sortOrder": 2
        }
      ]
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000602",
      "name": "[시연] 행사 안내소",
      "categoryCode": "OTHER",
      "description": "주최자 직접 등록 부스",
      "operationStatus": "PREPARING",
      "visibilityStatus": "PUBLIC",
      "items": [
        {
          "id": "d3e02026-1111-4000-8000-000000000704",
          "name": "[시연] 행사 안내",
          "description": "무료 안내",
          "priceKrw": 0,
          "stockStatus": "UNLIMITED",
          "sortOrder": 0
        }
      ]
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000603",
      "name": "[시연] 별빛 에이드",
      "categoryCode": "BEVERAGE",
      "description": "레몬·청포도 에이드",
      "operationStatus": "OPEN",
      "visibilityStatus": "PUBLIC",
      "items": [
        {
          "id": "d3e02026-1111-4000-8000-000000000705",
          "name": "레몬 에이드",
          "description": "",
          "priceKrw": 3500,
          "stockStatus": "AVAILABLE",
          "sortOrder": 0
        },
        {
          "id": "d3e02026-1111-4000-8000-000000000706",
          "name": "청포도 에이드",
          "description": "",
          "priceKrw": 3500,
          "stockStatus": "LOW",
          "sortOrder": 1
        }
      ]
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000604",
      "name": "[시연] 손끝 공방",
      "categoryCode": "EXPERIENCE",
      "description": "키링 만들기 체험",
      "operationStatus": "PREPARING",
      "visibilityStatus": "PUBLIC",
      "items": [
        {
          "id": "d3e02026-1111-4000-8000-000000000707",
          "name": "키링 만들기",
          "description": "",
          "priceKrw": 5000,
          "stockStatus": "AVAILABLE",
          "sortOrder": 0
        }
      ]
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000605",
      "name": "[시연] 구름 마켓",
      "categoryCode": "GOODS",
      "description": "학생 창작 소품",
      "operationStatus": "CLOSED",
      "visibilityStatus": "PUBLIC",
      "items": [
        {
          "id": "d3e02026-1111-4000-8000-000000000708",
          "name": "구름 키링",
          "description": "",
          "priceKrw": 6000,
          "stockStatus": "SOLD_OUT",
          "sortOrder": 0
        }
      ]
    }
  ],
  "notices": [
    {
      "id": "d3e02026-1111-4000-8000-000000000801",
      "title": "[시연] 긴급 운영 안내",
      "body": "일반 방문객 공지 예시입니다.",
      "isUrgent": true,
      "audiences": [
        "PUBLIC"
      ],
      "publicationStatus": "PUBLISHED"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000803",
      "title": "[시연] 부스 운영자 안내",
      "body": "부스 운영자는 준비 상태와 재고를 확인해 주세요.",
      "isUrgent": false,
      "audiences": [
        "OPERATORS"
      ],
      "publicationStatus": "PUBLISHED"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000802",
      "title": "[시연] 스태프 집합 안내",
      "body": "스태프는 운영본부에서 업무를 확인해 주세요.",
      "isUrgent": false,
      "audiences": [
        "STAFF"
      ],
      "publicationStatus": "PUBLISHED"
    }
  ],
  "duties": [
    {
      "id": "d3e02026-1111-4000-8000-000000000901",
      "zone": "정문",
      "name": "입구 안내"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000903",
      "zone": "부스 구역",
      "name": "순찰"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000000902",
      "zone": "운영본부",
      "name": "현장 지원"
    }
  ],
  "shiftIds": [
    "d3e02026-1111-4000-8000-000000002001",
    "d3e02026-1111-4000-8000-000000002002",
    "d3e02026-1111-4000-8000-000000002003",
    "d3e02026-1111-4000-8000-000000002011",
    "d3e02026-1111-4000-8000-000000002012",
    "d3e02026-1111-4000-8000-000000002013",
    "d3e02026-1111-4000-8000-000000002021",
    "d3e02026-1111-4000-8000-000000002022",
    "d3e02026-1111-4000-8000-000000002023",
    "d3e02026-1111-4000-8000-000000002031",
    "d3e02026-1111-4000-8000-000000002032",
    "d3e02026-1111-4000-8000-000000002033"
  ],
  "staff": [
    {
      "id": "d3e02026-1111-4000-8000-000000001001",
      "role": "ADMIN",
      "status": "WAITING",
      "dutyId": null,
      "memo": "[시연] 주최측 테스트 메모"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000001002",
      "role": "ADMIN",
      "status": "WAITING",
      "dutyId": null,
      "memo": "[시연] 주최측 테스트 메모"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000001006",
      "role": "STAFF",
      "status": "WAITING",
      "dutyId": "d3e02026-1111-4000-8000-000000000901",
      "memo": "[시연] 주최측 테스트 메모"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000001007",
      "role": "LABOR",
      "status": "WORKING",
      "dutyId": "d3e02026-1111-4000-8000-000000000901",
      "memo": "[시연] 주최측 테스트 메모"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000001008",
      "role": "VOLUNTEER",
      "status": "BREAK",
      "dutyId": "d3e02026-1111-4000-8000-000000000902",
      "memo": "[시연] 주최측 테스트 메모"
    },
    {
      "id": "d3e02026-1111-4000-8000-000000001009",
      "role": "STAFF",
      "status": "PENDING",
      "dutyId": null,
      "memo": "[시연] 주최측 테스트 메모"
    }
  ]
}
